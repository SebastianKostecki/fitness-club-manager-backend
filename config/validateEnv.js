require('dotenv').config();

/**
 * Database: DATABASE_URL albo pełny zestaw DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
 * DB_PASSWORD może być pustym stringiem (np. lokalny MySQL bez hasła).
 */
function assertDatabaseEnv() {
  const databaseUrl = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
  const discreteOk =
    process.env.DB_HOST &&
    String(process.env.DB_HOST).trim() &&
    process.env.DB_USER !== undefined &&
    String(process.env.DB_USER).trim() !== '' &&
    process.env.DB_NAME &&
    String(process.env.DB_NAME).trim() &&
    process.env.DB_PASSWORD !== undefined &&
    process.env.DB_PASSWORD !== null;

  if (!databaseUrl && !discreteOk) {
    throw new Error(
      'Database env incomplete: set DATABASE_URL, or DB_HOST + DB_USER + DB_PASSWORD + DB_NAME (DB_PASSWORD may be empty string).'
    );
  }
}

function assertJwtEnv() {
  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    throw new Error('JWT_SECRET is required and must be non-empty.');
  }
}

function logEnvSanitized() {
  const hasUrl = !!(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
  console.log('[env] JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'missing');
  if (hasUrl) {
    console.log('[env] Database: DATABASE_URL (value hidden)');
  } else {
    console.log('[env] Database: discrete MySQL');
    console.log('[env]   DB_HOST:', process.env.DB_HOST);
    console.log('[env]   DB_USER:', process.env.DB_USER);
    console.log('[env]   DB_NAME:', process.env.DB_NAME);
    console.log('[env]   DB_PASSWORD:', process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '' ? '(set)' : process.env.DB_PASSWORD === '' ? '(empty)' : 'missing');
    if (process.env.DB_PORT) console.log('[env]   DB_PORT:', process.env.DB_PORT);
    if (process.env.DB_SSL) console.log('[env]   DB_SSL:', process.env.DB_SSL);
  }
}

function validateEnv() {
  assertDatabaseEnv();
  assertJwtEnv();
  logEnvSanitized();
}

module.exports = {
  validateEnv,
  assertDatabaseEnv,
  assertJwtEnv,
  logEnvSanitized
};
