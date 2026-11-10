// Reads and validates configuration from environment variables.

function intFromEnv(env, name, fallback, { min = 0 } = {}) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${name} must be an integer >= ${min}`);
  }
  return value;
}

function loadConfig(env = process.env) {
  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: intFromEnv(env, 'PORT', 3000, { min: 1 }),
    db: {
      host: env.DB_HOST || '127.0.0.1',
      port: intFromEnv(env, 'DB_PORT', 5432, { min: 1 }),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      timezone: env.DB_TIMEZONE || 'Asia/Jakarta',
    },
    publicBaseUrl: (env.PUBLIC_BASE_URL || 'http://localhost:8080').replace(/\/$/, ''),
    clientOrigin: env.CLIENT_ORIGIN || '',
    createRateLimit: intFromEnv(env, 'CREATE_RATE_LIMIT', 30, { min: 1 }),
  };
}

module.exports = { loadConfig };
