const { Sequelize } = require("sequelize");

// Use DATABASE_URL for PlanetScale or fallback to individual env vars
const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: "mysql",
        logging: false, // Disable logging in production
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
        process.env.DB_NAME || "sibbo18_fitness", 
        process.env.DB_USER || "sibbo18_admin",
        process.env.DB_PASSWORD || "Galaktyka360",
        {
            host: process.env.DB_HOST || "mn01.webd.pl",
            dialect: "mysql",
            logging: console.log,
            pool: { acquire: 15000 },
            dialectOptions: { 
                connectTimeout: 10000, 
                supportBigNumbers: true, 
                bigNumberStrings: true 
            }
        }
    )

module.exports = sequelize;