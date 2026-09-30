import app from '../server.js';
import { initDatabase } from '../src/server/database.js';

// Pre-warm the database on serverless cold starts
initDatabase().catch((err) => {
  console.error('[Vercel Serverless] DB pre-warm error:', err);
});

export default app;
