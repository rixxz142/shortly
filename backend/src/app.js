// Builds the Express application. Kept separate from server.js so tests can
// create an app with their own (fake) database pool.
const express = require('express');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./middleware/errors');
const { urlsRouter } = require('./routes/urls');
const { redirectRouter } = require('./routes/redirect');

function createApp({ config, pool, logRequests = true }) {
  const app = express();
  const deps = { config, pool };

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Nginx sits in front of the API
  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));

  if (config.clientOrigin) {
    app.use((req, res, next) => {
      res.set('Access-Control-Allow-Origin', config.clientOrigin);
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Allow-Methods', 'GET,POST,DELETE');
      if (req.method === 'OPTIONS') return res.status(204).end();
      return next();
    });
  }

  if (logRequests) {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
      });
      next();
    });
  }

  // Readiness check: verifies the database connection, not just the process.
  const health = async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'up', time: new Date().toISOString() });
    } catch (err) {
      console.error('[health] database check failed:', err.message);
      res.status(503).json({ status: 'error', database: 'down' });
    }
  };
  app.get('/health', health);
  app.get('/api/health', health);

  app.use('/api/urls', urlsRouter(deps));
  app.use('/api', notFound); // unknown /api paths never fall through to redirects
  app.use('/', redirectRouter(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
