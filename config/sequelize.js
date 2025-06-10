const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    "sibbo18_fitness", 
    "sibbo18_admin",
    "Galaktyka360",
    {host: "mn01.webd.pl", dialect: "mysql"}
)

module.exports = sequelize;