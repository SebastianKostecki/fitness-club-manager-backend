require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const Router = require('./routes/routes');
const sequelize = require('./config/sequelize');
const cronJobs = require('./jobs/cronJobs');

const app = express();

// Render stoi za proxy (secure cookies)
app.set('trust proxy', 1);

// CORS: GH Pages + lokalny dev
const allowedOrigins = [
  'https://sebastiankostecki.github.io',
  'http://localhost:4200',
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parsowanie + cookies
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Static (opcjonalnie)
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck
app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/debug/db', async (_req, res) => {
  try { await sequelize.authenticate(); res.json({ db: 'ok' }); }
  catch (e) { res.status(500).json({ db: 'fail', error: e.message }); }
});

// API routes
app.use(Router);

// Globalne logi błędów
process.on('unhandledRejection', e => console.error('UNHANDLED REJECTION:', e));
process.on('uncaughtException', e => console.error('UNCAUGHT EXCEPTION:', e));

// Start
console.time('boot');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;
app.listen(PORT, HOST, () => {
  console.timeEnd('boot');
  console.log(`🚀 FITNESS CLUB BACKEND READY on http://${HOST}:${PORT} - CORS configured for credentials`);
});

// DB + crony po starcie
sequelize.authenticate()
  .then(() => { console.log('DB OK'); cronJobs.init(); })
  .catch(e => console.error('DB FAIL:', e.message));