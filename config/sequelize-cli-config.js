/**
 * Konfiguracja dla sequelize-cli (migracje). Wyłącznie ze zmiennych środowiskowych.
 * @see https://sequelize.org/docs/v6/other-topics/migrations/
 */
require('dotenv').config();

function getEnvironmentConfig() {
  if (process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'mysql',
      dialectOptions: {
        ssl: { rejectUnauthorized: true },
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
        typeCast: true
      },
      ...(process.env.DB_TIMEZONE ? { timezone: process.env.DB_TIMEZONE } : {})
    };
  }

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  for (const key of required) {
    if (process.env[key] === undefined || process.env[key] === null) {
      throw new Error(`sequelize-cli: missing ${key} in environment (or set DATABASE_URL)`);
    }
  }
  if (!String(process.env.DB_HOST).trim() || !String(process.env.DB_NAME).trim()) {
    throw new Error('sequelize-cli: DB_HOST and DB_NAME must be non-empty');
  }

  const config = {
    username: String(process.env.DB_USER).trim(),
    password: process.env.DB_PASSWORD,
    database: String(process.env.DB_NAME).trim(),
    host: String(process.env.DB_HOST).trim(),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: 'mysql',
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true,
      ...((process.env.DB_SSL === 'true' || process.env.DB_SSL === '1')
        ? { ssl: { rejectUnauthorized: true } }
        : {})
    },
    ...(process.env.DB_TIMEZONE ? { timezone: process.env.DB_TIMEZONE } : {})
  };

  return config;
}

const shared = getEnvironmentConfig();

module.exports = {
  development: shared,
  production: shared,
  test: shared
};
