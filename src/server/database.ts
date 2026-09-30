import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface SqliteReview {
  id: string;
  authorName: string;
  country?: string;
  city: string;
  rating: number;
  comment: string;
  transactionId?: string;
  corridor: 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA';
  verified: boolean;
  date: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: string;
  totalReviews: number;
}

interface ReviewRecord {
  id: string;
  author_name: string;
  country: string | null;
  city: string;
  rating: number;
  comment: string;
  transaction_id: string | null;
  corridor: string;
  verified: number;
  ip_address: string;
  status: string;
  created_at: string;
}

function getStorageDir(): string {
  // On Vercel / AWS Lambda, only /tmp is writable
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  const localDir = path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, '.write_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    return '/tmp';
  }
}

const STORAGE_DIR = getStorageDir();
const SQLITE_FILE = path.join(STORAGE_DIR, 'rapidex.sqlite');
const JSON_FILE = path.join(STORAGE_DIR, 'rapidex_reviews.json');

let storageEngine: 'sqlite' | 'json' = 'sqlite';
let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let jsonReviews: ReviewRecord[] = [];

// Simple in-memory IP rate limiter: max 3 submissions per 5 minutes per IP
const ipSubmissions = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const timestamps = (ipSubmissions.get(ip) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= 3) {
    return false; // Rate limited
  }

  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return true;
}

function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case "'":
          return '&#39;';
        case '"':
          return '&quot;';
        case '&':
          return '&amp;';
        default:
          return char;
      }
    })
    .trim();
}

/**
 * Format relative date for UI
 */
function formatRelativeDate(isoDate: string): string {
  try {
    const past = new Date(isoDate).getTime();
    const now = Date.now();
    const diffHours = Math.floor((now - past) / (3600 * 1000));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l’instant';
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Récemment';
  }
}

let initPromise: Promise<void> | null = null;
let isInitialized = false;

function loadJsonBackup(): void {
  storageEngine = 'json';
  try {
    if (fs.existsSync(JSON_FILE)) {
      const raw = fs.readFileSync(JSON_FILE, 'utf-8');
      jsonReviews = JSON.parse(raw);
    } else {
      jsonReviews = [];
    }
  } catch (err) {
    console.warn('[Database] Failed to read JSON reviews file, resetting to empty array:', err);
    jsonReviews = [];
  }
}

function saveJsonBackup(): void {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonReviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write JSON reviews file:', err);
  }
}

export function saveDatabase(): void {
  if (storageEngine === 'sqlite' && db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(SQLITE_FILE, buffer);
    } catch (err) {
      console.error('[Database] Failed to write sqlite db to disk:', err);
    }
  } else if (storageEngine === 'json') {
    saveJsonBackup();
  }
}

/**
 * Initialize SQLite database with JSON fallback
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }

      // Attempt to initialize SqlJs
      try {
        if (!SQL) {
          SQL = await initSqlJs();
        }

        if (fs.existsSync(SQLITE_FILE)) {
          try {
            const fileBuffer = fs.readFileSync(SQLITE_FILE);
            db = new SQL.Database(fileBuffer);
          } catch {
            db = new SQL.Database();
          }
        } else {
          db = new SQL.Database();
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            author_name TEXT NOT NULL,
            country TEXT,
            city TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            transaction_id TEXT,
            corridor TEXT DEFAULT 'RUSSIA_TO_AFRICA',
            verified INTEGER DEFAULT 1,
            ip_address TEXT,
            status TEXT DEFAULT 'approved',
            created_at TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews(status, created_at DESC);
        `);

        try {
          db.run('ALTER TABLE reviews ADD COLUMN country TEXT;');
        } catch {
          // Column already exists
        }

        storageEngine = 'sqlite';
        console.log(`[Database] SQLite initialized successfully in ${SQLITE_FILE}`);
      } catch (sqlJsError) {
        console.warn('[Database] sql.js initialization failed or wasm unavailable, activating JSON storage engine:', sqlJsError);
        loadJsonBackup();
        console.log(`[Database] JSON storage engine active at ${JSON_FILE}`);
      }

      isInitialized = true;
    } catch (err) {
      console.error('[Database] Initialization error:', err);
      loadJsonBackup();
      isInitialized = true;
    }
  })();

  return initPromise;
}

// Auto-trigger initialization in background
initDatabase().catch((e) => console.error('[Database] Pre-init background error:', e));

async function ensureDatabase(): Promise<void> {
  if (!isInitialized) {
    await initDatabase();
  }
}

/**
 * Fetch all approved reviews
 */
export async function getAllReviews(): Promise<{ reviews: SqliteReview[]; stats: ReviewStats }> {
  await ensureDatabase();

  if (storageEngine === 'sqlite' && db) {
    try {
      const query = `
        SELECT id, author_name, city, rating, comment, transaction_id, corridor, verified, created_at, country
        FROM reviews
        WHERE status = 'approved'
        ORDER BY created_at DESC
      `;

      const results = db.exec(query);
      if (!results.length || !results[0].values.length) {
        return { reviews: [], stats: { averageRating: '0.0', totalReviews: 0 } };
      }

      const rows = results[0].values;
      let totalRating = 0;

      const reviews: SqliteReview[] = rows.map((row) => {
        const rating = Number(row[3]) || 5;
        totalRating += rating;
        const createdAt = String(row[8]);
        const country = row[9] ? String(row[9]) : undefined;

        return {
          id: String(row[0]),
          authorName: String(row[1]),
          country,
          city: String(row[2]),
          rating,
          comment: String(row[4]),
          transactionId: row[5] ? String(row[5]) : undefined,
          corridor: (String(row[6]) === 'AFRICA_TO_RUSSIA' ? 'AFRICA_TO_RUSSIA' : 'RUSSIA_TO_AFRICA') as 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA',
          verified: Boolean(row[7]),
          date: formatRelativeDate(createdAt),
          createdAt,
        };
      });

      const averageRating = (totalRating / reviews.length).toFixed(1);

      return {
        reviews,
        stats: {
          averageRating,
          totalReviews: reviews.length,
        },
      };
    } catch (err) {
      console.error('[Database] SQLite query error, falling back to JSON:', err);
    }
  }

  // JSON storage fallback
  const approved = jsonReviews
    .filter((r) => r.status === 'approved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!approved.length) {
    return { reviews: [], stats: { averageRating: '0.0', totalReviews: 0 } };
  }

  let totalRating = 0;
  const reviews: SqliteReview[] = approved.map((r) => {
    totalRating += r.rating;
    return {
      id: r.id,
      authorName: r.author_name,
      country: r.country || undefined,
      city: r.city,
      rating: r.rating,
      comment: r.comment,
      transactionId: r.transaction_id || undefined,
      corridor: (r.corridor === 'AFRICA_TO_RUSSIA' ? 'AFRICA_TO_RUSSIA' : 'RUSSIA_TO_AFRICA') as 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA',
      verified: Boolean(r.verified),
      date: formatRelativeDate(r.created_at),
      createdAt: r.created_at,
    };
  });

  const averageRating = (totalRating / reviews.length).toFixed(1);

  return {
    reviews,
    stats: {
      averageRating,
      totalReviews: reviews.length,
    },
  };
}

/**
 * Clear all reviews
 */
export async function clearAllReviews(): Promise<{ success: boolean; count: number }> {
  await ensureDatabase();
  try {
    if (storageEngine === 'sqlite' && db) {
      db.run('DELETE FROM reviews;');
    }
    jsonReviews = [];
    saveDatabase();
    console.log('[Database] All reviews cleared.');
    return { success: true, count: 0 };
  } catch (err) {
    console.error('[Database] Failed to clear reviews:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Insert a verified real review with anti-spam check
 */
export async function insertReview(payload: {
  authorName: string;
  country?: string;
  city?: string;
  rating: number;
  comment: string;
  transactionId?: string;
  corridor?: 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA';
  ipAddress?: string;
}): Promise<{ success: boolean; review?: SqliteReview; error?: string }> {
  await ensureDatabase();

  const ip = payload.ipAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return {
      success: false,
      error: 'Trop de requêtes. Veuillez patienter quelques minutes avant de publier un nouvel avis.',
    };
  }

  const cleanName = sanitizeText(payload.authorName).slice(0, 50);
  const cleanCountry = sanitizeText(payload.country || '').slice(0, 50);
  let cleanCity = sanitizeText(payload.city || '').slice(0, 50);
  const cleanComment = sanitizeText(payload.comment).slice(0, 600);
  const rating = Math.min(Math.max(Number(payload.rating) || 5, 1), 5);
  const corridor = payload.corridor === 'AFRICA_TO_RUSSIA' ? 'AFRICA_TO_RUSSIA' : 'RUSSIA_TO_AFRICA';
  const cleanTxId = payload.transactionId ? sanitizeText(payload.transactionId).slice(0, 20) : undefined;

  // Validation
  if (cleanName.length < 2) {
    return { success: false, error: 'Le nom doit comporter au moins 2 caractères.' };
  }

  // Country & City validation:
  const isRussia = cleanCountry.toLowerCase().includes('russi') || cleanCountry.toLowerCase().includes('росси');
  if (isRussia) {
    if (cleanCity.length < 2) {
      return { success: false, error: 'Veuillez sélectionner votre ville en Russie.' };
    }
  } else {
    // African country selected
    if (cleanCountry.length >= 2 && !cleanCity) {
      cleanCity = cleanCountry;
    } else if (cleanCity.length < 2) {
      return { success: false, error: 'Veuillez sélectionner votre pays.' };
    }
  }

  if (cleanComment.length < 8) {
    return { success: false, error: 'Le commentaire doit comporter au moins 8 caractères.' };
  }

  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newReview: SqliteReview = {
    id,
    authorName: cleanName,
    country: cleanCountry || undefined,
    city: cleanCity,
    rating,
    comment: cleanComment,
    transactionId: cleanTxId,
    corridor,
    verified: true,
    date: 'À l’instant',
    createdAt: nowIso,
  };

  try {
    if (storageEngine === 'sqlite' && db) {
      db.run(
        `INSERT INTO reviews (id, author_name, country, city, rating, comment, transaction_id, corridor, verified, ip_address, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'approved', ?)`,
        [id, cleanName, cleanCountry || null, cleanCity, rating, cleanComment, cleanTxId || null, corridor, ip, nowIso]
      );
    } else {
      jsonReviews.push({
        id,
        author_name: cleanName,
        country: cleanCountry || null,
        city: cleanCity,
        rating,
        comment: cleanComment,
        transaction_id: cleanTxId || null,
        corridor,
        verified: 1,
        ip_address: ip,
        status: 'approved',
        created_at: nowIso,
      });
    }

    saveDatabase();

    return { success: true, review: newReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Storage error';
    console.error('[Database] Failed to insert review:', err);
    return { success: false, error: `Erreur d'enregistrement : ${msg}` };
  }
}
