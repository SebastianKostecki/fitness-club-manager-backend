const { Sequelize } = require('sequelize');
require('dotenv').config();
const { assertDatabaseEnv } = require('./validateEnv');

assertDatabaseEnv();

const databaseUrl = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true
        },
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
        supportBigNumbers: true,
        bigNumberStrings: true
      }
    })
  : new Sequelize(
      String(process.env.DB_NAME).trim(),
      String(process.env.DB_USER).trim(),
      process.env.DB_PASSWORD,
      {
        host: String(process.env.DB_HOST).trim(),
        dialect: 'mysql',
        logging: console.log,
        pool: { acquire: 15000 },
        ...(process.env.DB_PORT
          ? { port: Number(process.env.DB_PORT) }
          : {}),
        dialectOptions: {
          connectTimeout: 10000,
          supportBigNumbers: true,
          bigNumberStrings: true,
          ...((process.env.DB_SSL === 'true' || process.env.DB_SSL === '1')
            ? { ssl: { rejectUnauthorized: true } }
            : {})
        }
      }
    );

module.exports = sequelize;
