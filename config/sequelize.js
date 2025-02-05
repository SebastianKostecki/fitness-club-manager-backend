const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    "fitness", 
    "root",
    "",
    {host: "localhost", dialect: "mysql"}
)

module.exports = sequelize;