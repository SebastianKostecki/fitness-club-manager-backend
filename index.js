const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const Router = require("./routes/routes");
const mySqlConnection = require('./config/database');

/*
 * Express & bodyParser
 *
 */

const app = express(); // init express
app.use(express.json()); // use express json
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors()); // use cors

const PORT =  8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}. (http://localhost:${PORT}/)`);
});

/*
 * Use router
 *
 */
app.use(Router);

/*
 * @TODO: Connect to DB
 *
 */

mySqlConnection.connect((error)=>{
  if (!error){
    console.log("------------------------");
  console.log("\x1b[32m%s\x1b[0m", "✓ | Connected");
  console.log("------------------------");
  } else {
    console.log("------------------------");
  console.log("\x1b[31m%s\x1b[0m", "✗ | Connection Failed");
  console.log("------------------------");
  console.log(error);
  console.log("------------------------");
  }
})

mySqlConnection.end();
