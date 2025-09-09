const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    "sibbo18_fitness", 
    "sibbo18_admin",
    "Galaktyka360",
    {
        host: process.env.DB_HOST || "mn01.webd.pl",
        dialect: "mysql",
        logging: console.log,
        pool: { acquire: 15000 },              // 15s
        dialectOptions: { 
            connectTimeout: 10000, 
            supportBigNumbers: true, 
            bigNumberStrings: true 
        }
    }
)

module.exports = sequelize;