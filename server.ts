import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import app from './src/server/app.ts';
import { initDatabase } from './src/server/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  await initDatabase();
  console.log('[Rapidex Server] Database initialized.');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(app.static ? app.static(path.resolve(__dirname, 'dist')) : (await import('express')).default.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
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
