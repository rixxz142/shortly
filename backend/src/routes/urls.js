// /api/urls — list, create, read stats and delete shortened URLs.
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { HttpError } = require('../errors');
const { validateUrl, parseId } = require('../validation');
const { createShortUrl } = require('../services/shortCode');

function withShortUrl(row, baseUrl) {
  return { ...row, short_url: `${baseUrl}/${row.short_code}` };
}

function urlsRouter({ config, pool }) {
  const router = express.Router();
  const createLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: config.createRateLimit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many links created, please try again in a minute' },
  });

  // GET /api/urls — newest first.
  router.get('/', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, short_code, original_url, clicks, created_at
       FROM urls ORDER BY created_at DESC, id DESC LIMIT 200`,
    );
    res.json(rows.map((row) => withShortUrl(row, config.publicBaseUrl)));
  });

  // GET /api/urls/stats — totals for the overview cards.
  router.get('/stats', async (req, res) => {
    const { rows: [stats] } = await pool.query(
      `SELECT COUNT(*)::int AS total_links, COALESCE(SUM(clicks), 0)::int AS total_clicks FROM urls`,
    );
    res.json(stats);
  });

  // POST /api/urls — create a short link, 201 Created.
  router.post('/', createLimiter, async (req, res) => {
    const originalUrl = validateUrl(req.body?.original_url);
    const row = await createShortUrl(pool, originalUrl);
    res.status(201).location(`/api/urls/${row.id}`).json(withShortUrl(row, config.publicBaseUrl));
  });

  // DELETE /api/urls/:id — 204 No Content.
  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const { rowCount } = await pool.query('DELETE FROM urls WHERE id = $1', [id]);
    if (rowCount === 0) throw new HttpError(404, 'Short link not found');
    res.status(204).end();
  });

  return router;
}

module.exports = { urlsRouter };
