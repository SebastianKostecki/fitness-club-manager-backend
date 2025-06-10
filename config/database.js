const { createConnection } = require("mysql");

const mySqlConnection = createConnection({
    host: "wn01.webd.pl",
  user: "sibbo18_admin",
  password: "Galaktyka360",
  database: "sibbo18_fitness",
  multipleStatements: true,
})

module.exports = mySqlConnection