import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';
import { fleetManager } from './server/services/fleetManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    // Dev mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Initialize periodic fleet scan (every 60 seconds)
  fleetManager.startScheduler(60);

  // Trigger initial background health scan
  setTimeout(() => {
    fleetManager.auditAll().catch((err) => {
      console.error('Initial audit error:', err);
    });
  }, 1500);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MK Monitor lancé sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur de démarrage du serveur MK Monitor:', err);
  process.exit(1);
});
