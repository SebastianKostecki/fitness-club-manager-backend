const { createConnection } = require("mysql");

const mySqlConnection = createConnection({
    host: "mn01.webd.pl",
    // host: "194.181.228.5",
    port: 3306,
  user: "sibbo18_admin",
  password: "Galaktyka360",
  database: "sibbo18_fitness",
  multipleStatements: true,
})

module.exports = mySqlConnection