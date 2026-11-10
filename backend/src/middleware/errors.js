// 404 and error handlers. Clients never receive stack traces.
const { HttpError } = require('../errors');

function notFound(req, res, next) {
  next(new HttpError(404, 'Resource not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let details = err.details;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body must be valid JSON';
  } else if (err.code === '23505') {
    status = 409;
    message = 'A record with these values already exists';
  } else if (!(err instanceof HttpError) && status >= 500) {
    message = 'Internal server error';
    details = undefined;
  }

  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}:`, err);

  const body = { error: message };
  if (details) body.details = details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
