// Generates random, URL-safe short codes using a cryptographic RNG.
const crypto = require('node:crypto');

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_LENGTH = 6;

function generateCode(length = DEFAULT_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

// Inserts a new URL, retrying with a fresh code on the rare unique collision.
async function createShortUrl(pool, originalUrl, attempts = 5) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO urls (short_code, original_url)
         VALUES ($1, $2)
         RETURNING id, short_code, original_url, clicks, created_at`,
        [generateCode(), originalUrl],
      );
      return rows[0];
    } catch (err) {
      if (err.code !== '23505' || i === attempts - 1) throw err;
    }
  }
  return null;
}

module.exports = { generateCode, createShortUrl, ALPHABET };
