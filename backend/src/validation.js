// Input validation for submitted URLs and short codes.
const { HttpError } = require('./errors');

const MAX_URL_LENGTH = 2048;
const CODE_RE = /^[A-Za-z0-9_-]{4,20}$/;

// Accepts only absolute http(s) URLs; rejects javascript:, data:, file:, etc.
function validateUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new HttpError(400, 'Validation failed', { original_url: 'URL is required' });
  }
  const value = input.trim();
  if (value.length > MAX_URL_LENGTH) {
    throw new HttpError(400, 'Validation failed', { original_url: `URL must be at most ${MAX_URL_LENGTH} characters` });
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new HttpError(400, 'Validation failed', { original_url: 'URL is not valid' });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new HttpError(400, 'Validation failed', { original_url: 'Only http and https URLs are allowed' });
  }
  return parsed.toString();
}

function isValidCode(code) {
  return typeof code === 'string' && CODE_RE.test(code);
}

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id');
  return id;
}

module.exports = { validateUrl, isValidCode, parseId, MAX_URL_LENGTH };
