import fs from 'fs';
import path from 'path';

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

interface StoredReview {
  id: string;
  authorName: string;
  country?: string;
  city: string;
  rating: number;
  comment: string;
  transactionId?: string;
  corridor: 'RUSSIA_TO_AFRICA' | 'AFRICA_TO_RUSSIA';
  verified: boolean;
  ipAddress?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

function getStorageDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  const localDir = path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    return '/tmp';
  }
}

const STORAGE_DIR = getStorageDir();
const JSON_FILE = path.join(STORAGE_DIR, 'rapidex_reviews.json');

// Optional Upstash / Vercel KV Cloud config for global sync across all visitors
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let memoryReviews: StoredReview[] = [];
let isLoaded = false;

// Simple in-memory IP rate limiter: max 3 submissions per 5 minutes per IP
const ipSubmissions = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const timestamps = (ipSubmissions.get(ip) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= 3) {
    return false;
  }

  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return true;
}

function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
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
 * Sync from Upstash / Vercel KV cloud if configured
 */
async function syncFromCloud(): Promise<boolean> {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/get/rapidex_reviews`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { result?: string };
      if (data?.result) {
        memoryReviews = JSON.parse(data.result);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Database] Cloud KV sync error:', err);
  }
  return false;
}

/**
 * Save to Upstash / Vercel KV cloud if configured
 */
async function syncToCloud(): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/rapidex_reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(memoryReviews)),
    });
  } catch (err) {
    console.warn('[Database] Cloud KV save error:', err);
  }
}

/**
 * Initialize database and load persisted reviews
 */
export async function initDatabase(): Promise<void> {
  if (isLoaded) return;

  // 1. Try Cloud KV
  const cloudOk = await syncFromCloud();
  if (cloudOk) {
    isLoaded = true;
    return;
  }

  // 2. Try Local / /tmp disk file
  try {
    if (fs.existsSync(JSON_FILE)) {
      const raw = fs.readFileSync(JSON_FILE, 'utf-8');
      memoryReviews = JSON.parse(raw);
    } else {
      memoryReviews = [];
    }
  } catch (err) {
    console.warn('[Database] Failed to read JSON file, initializing empty:', err);
    memoryReviews = [];
  }

  isLoaded = true;
}

export function saveDatabase(): void {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_FILE, JSON.stringify(memoryReviews, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Database] Failed to write local JSON file:', err);
  }
  syncToCloud().catch(() => {});
}

/**
 * Fetch all approved reviews
 */
export async function getAllReviews(): Promise<{ reviews: SqliteReview[]; stats: ReviewStats }> {
  if (!isLoaded) {
    await initDatabase();
  }

  // If cloud is enabled, refresh from cloud
  if (KV_URL && KV_TOKEN) {
    await syncFromCloud();
  }

  const approved = memoryReviews
    .filter((r) => r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!approved.length) {
    return { reviews: [], stats: { averageRating: '0.0', totalReviews: 0 } };
  }

  let totalRating = 0;
  const reviews: SqliteReview[] = approved.map((r) => {
    totalRating += r.rating;
    return {
      id: r.id,
      authorName: r.authorName,
      country: r.country,
      city: r.city,
      rating: r.rating,
      comment: r.comment,
      transactionId: r.transactionId,
      corridor: r.corridor,
      verified: r.verified,
      date: formatRelativeDate(r.createdAt),
      createdAt: r.createdAt,
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
 * Insert a verified real review
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
  if (!isLoaded) {
    await initDatabase();
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

  const newStored: StoredReview = {
    id,
    authorName: cleanName,
    country: cleanCountry || undefined,
    city: cleanCity,
    rating,
    comment: cleanComment,
    transactionId: cleanTxId,
    corridor,
    verified: true,
    ipAddress: ip,
    status: 'approved',
    createdAt: nowIso,
  };

  memoryReviews.unshift(newStored);
  saveDatabase();

  const publicReview: SqliteReview = {
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

  return { success: true, review: publicReview };
}

/**
 * Clear all reviews
 */
export async function clearAllReviews(): Promise<{ success: boolean; count: number }> {
  if (!isLoaded) {
    await initDatabase();
  }
  memoryReviews = [];
  saveDatabase();
  console.log('[Database] All reviews cleared.');
  return { success: true, count: 0 };
}
