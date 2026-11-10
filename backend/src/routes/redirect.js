// GET /:code — counts the click and redirects with HTTP 302.
const express = require('express');
const { HttpError } = require('../errors');
const { isValidCode } = require('../validation');

function redirectRouter({ pool }) {
  const router = express.Router();

  router.get('/:code', async (req, res) => {
    const { code } = req.params;
    if (!isValidCode(code)) throw new HttpError(404, 'Short link not found');

    // One atomic statement: increments and reads the destination together.
    const { rows } = await pool.query(
      `UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1 RETURNING original_url`,
      [code],
    );
    if (rows.length === 0) throw new HttpError(404, 'Short link not found');

    res.set('Cache-Control', 'no-store'); // every visit must reach the counter
    res.redirect(302, rows[0].original_url);
  });

  return router;
}

module.exports = { redirectRouter };
