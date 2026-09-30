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

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'rapidex.sqlite');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

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
 * Initialize SQLite database with WAL-like persistence
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('[Database] Existing sqlite file could not be read, creating fresh db:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Schema creation
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

  // Migration for existing tables without country column
  try {
    db.run('ALTER TABLE reviews ADD COLUMN country TEXT;');
  } catch {
    // Column already exists
  }

  return db;
}

/**
 * Persist SQLite in-memory state to disk file
 */
export function saveDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[Database] Failed to write sqlite db to disk:', err);
  }
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

/**
 * Fetch all approved reviews from SQLite
 */
export function getAllReviews(): { reviews: SqliteReview[]; stats: ReviewStats } {
  if (!db) {
    return { reviews: [], stats: { averageRating: '0.0', totalReviews: 0 } };
  }

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
}

/**
 * Clear all reviews from SQLite (reset database)
 */
export function clearAllReviews(): { success: boolean; count: number } {
  if (!db) {
    return { success: false, count: 0 };
  }
  try {
    db.run("DELETE FROM reviews;");
    saveDatabase();
    console.log('[Rapidex Database] All reviews cleared.');
    return { success: true, count: 0 };
  } catch (err) {
    console.error('[Database] Failed to clear reviews:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Insert a verified real review into SQLite with anti-spam check
 */
export function insertReview(payload: {
  authorName: string;
  country?: string;
  city?: string;
  rating: number;
  comment: string;
  transactionId?: string;
  corridor?: 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA';
  ipAddress?: string;
}): { success: boolean; review?: SqliteReview; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialized' };
  }

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

  try {
    db.run(
      `INSERT INTO reviews (id, author_name, country, city, rating, comment, transaction_id, corridor, verified, ip_address, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'approved', ?)`,
      [id, cleanName, cleanCountry || null, cleanCity, rating, cleanComment, cleanTxId || null, corridor, ip, nowIso]
    );

    saveDatabase();

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

    return { success: true, review: newReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SQL error';
    console.error('[Database] Failed to insert review:', err);
    return { success: false, error: `Erreur d'enregistrement : ${msg}` };
  }
}
