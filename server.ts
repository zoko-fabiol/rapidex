import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CFA_EUR_PEG, DEFAULT_COMMISSION_PERCENT, computeAllRates } from './src/utils/calculator.js';
import { initDatabase, getAllReviews, insertReview, clearAllReviews } from './src/server/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory cache for Exchange Rates (10 minutes TTL = 600,000 ms)
const CACHE_TTL_MS = 10 * 60 * 1000; // 600 seconds
let cachedRatesData: {
  eurRub: number;
  lastUpdated: number;
  source: 'api' | 'fallback';
} | null = null;

// Fallback rates if external API is unreachable
const FALLBACK_EUR_RUB = 95.5;

async function fetchEurRubRate(): Promise<{ eurRub: number; source: 'api' | 'fallback' }> {
  const now = Date.now();
  if (cachedRatesData && now - cachedRatesData.lastUpdated < CACHE_TTL_MS) {
    return {
      eurRub: cachedRatesData.eurRub,
      source: cachedRatesData.source,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as { rates?: Record<string, number> };
    const eurRub = data?.rates?.RUB;

    if (eurRub && typeof eurRub === 'number' && eurRub > 0) {
      cachedRatesData = {
        eurRub,
        lastUpdated: now,
        source: 'api',
      };
      return { eurRub, source: 'api' };
    }
    throw new Error('RUB rate not found in response');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[ExchangeRate] Live fetch failed (${message}), using cache or fallback.`);
    if (cachedRatesData) {
      return { eurRub: cachedRatesData.eurRub, source: cachedRatesData.source };
    }
    return { eurRub: FALLBACK_EUR_RUB, source: 'fallback' };
  }
}

// GET /api/rates
app.get('/api/rates', async (req: Request, res: Response) => {
  try {
    const commissionParam = req.query.commission;
    const commissionPercent = commissionParam !== undefined ? Number(commissionParam) : DEFAULT_COMMISSION_PERCENT;
    const safeCommission = isNaN(commissionPercent) ? DEFAULT_COMMISSION_PERCENT : Math.min(Math.max(commissionPercent, 0), 10);

    const { eurRub, source } = await fetchEurRubRate();
    const { rawRates, clientRates } = computeAllRates(eurRub, safeCommission);

    const lastUpdatedDate = cachedRatesData ? new Date(cachedRatesData.lastUpdated) : new Date();
    const cachedUntilDate = new Date(lastUpdatedDate.getTime() + CACHE_TTL_MS);

    res.json({
      success: true,
      base: 'EUR',
      eurRub,
      eurCfa: CFA_EUR_PEG,
      commissionPercent: safeCommission,
      rawRates,
      clientRates,
      lastUpdated: lastUpdatedDate.toISOString(),
      cachedUntil: cachedUntilDate.toISOString(),
      source,
    });
  } catch (error: unknown) {
    console.error('Error in /api/rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate rates',
    });
  }
});

// GET /api/reviews - Real reviews from SQLite database
app.get('/api/reviews', (_req: Request, res: Response) => {
  try {
    const data = getAllReviews();
    res.json({
      success: true,
      reviews: data.reviews,
      stats: data.stats,
    });
  } catch (err: unknown) {
    console.error('Error fetching reviews from SQLite:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des avis' });
  }
});

// POST /api/reviews - Insert authentic review into SQLite with anti-spam check
app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const { authorName, country, city, rating, comment, corridor, transactionId } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = insertReview({
      authorName,
      country,
      city,
      rating,
      comment,
      corridor,
      transactionId,
      ipAddress,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const updated = getAllReviews();
    res.status(201).json({
      success: true,
      review: result.review,
      reviews: updated.reviews,
      stats: updated.stats,
    });
  } catch (err: unknown) {
    console.error('Error creating review in SQLite:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de l’enregistrement de l’avis' });
  }
});

// DELETE /api/reviews - Clear all reviews from SQLite
app.delete('/api/reviews', (_req: Request, res: Response) => {
  try {
    const result = clearAllReviews();
    res.json({ success: result.success, message: 'Tous les avis ont été réinitialisés avec succès.' });
  } catch (err: unknown) {
    console.error('Error clearing reviews from SQLite:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression des avis.' });
  }
});

// POST /api/transactions/init
app.post('/api/transactions/init', (req: Request, res: Response) => {
  const tx = req.body;
  res.status(201).json({
    success: true,
    transactionId: tx.id,
    message: 'Transaction enregistrée avec succès.',
    transaction: tx,
  });
});

async function startServer() {
  // Initialize SQLite persistent database
  try {
    await initDatabase();
    console.log('[Rapidex Database] SQLite initialized successfully with persistent storage.');
  } catch (dbErr) {
    console.error('[Rapidex Database] Failed to initialize SQLite:', dbErr);
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rapidex Server] Running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Rapidex Server] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
