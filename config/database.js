/**
 * Bezpośrednie połączenie mysql (legacy). Te same zmienne co Sequelize w trybie dyskretnym.
 * Nie używaj stałych — wyłącznie process.env.
 */
require('dotenv').config();
const { createConnection } = require('mysql');
const { assertDatabaseEnv } = require('./validateEnv');

assertDatabaseEnv();

if (process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()) {
  throw new Error(
    'config/database.js: DATABASE_URL is set — use Sequelize (config/sequelize.js) instead of the mysql driver, or unset DATABASE_URL for discrete DB_* config.'
  );
}

const mySqlConnection = createConnection({
  host: String(process.env.DB_HOST).trim(),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: String(process.env.DB_USER).trim(),
  password: process.env.DB_PASSWORD,
  database: String(process.env.DB_NAME).trim(),
  multipleStatements: true
});

module.exports = mySqlConnection;
