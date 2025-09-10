 require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const Router = require("./routes/routes");
const sequelize = require('./config/sequelize');
const cronJobs = require('./jobs/cronJobs');

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoints
app.get("/healthz", (req, res) => res.send("ok"));
app.get("/debug/db", async (req, res) => {
  try { 
    await sequelize.authenticate(); 
    res.json({ db: "ok" }); 
  }
  catch (e) { 
    res.status(500).json({ db: "fail", error: e.message }); 
  }
});

/*
 * Use router
 *
 */
app.use(Router);

/*
 * Global error handlers - prevent process from dying
 *
 */
process.on('unhandledRejection', e => console.error('UNHANDLED REJECTION:', e));
process.on('uncaughtException', e => console.error('UNCAUGHT EXCEPTION:', e));

/*
 * Start server (always) and check DB separately
 *
 */
console.time("boot");
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, HOST, () => {
  console.timeEnd("boot");
  console.log(`Listening on http://${HOST}:${PORT}`);
});

// Keep process alive (tymczasowa kotwica)
if (process.stdin.isTTY) process.stdin.resume();

// Check DB connection separately (don't block startup)
sequelize.authenticate()
  .then(() => {
    console.log("DB OK");
    // Initialize cron jobs after DB connection is confirmed
    cronJobs.init();
  })
  .catch(e => console.error("DB FAIL:", e.message));
