const { createConnection } = require("mysql");

const mySqlConnection = createConnection({
    host: "localhost",
  user: "root",
  password: "",
  database: "fitness",
  multipleStatements: true,
})

module.exports = mySqlConnection