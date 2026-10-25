const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Scholarship = require('./models/Scholarship');
const User = require('./models/User');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const savedScholarshipsRouter = require('./routes/savedScholarships');
const feedbackRouter = require('./routes/feedback');
const { optionalAuth } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d',
}));

function escapeRegex(s) {
  return s.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
}

// Health check
app.get('/api/health', (_req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
  });
});

// Mounted feature routers
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/saved-scholarships', savedScholarshipsRouter);
app.use('/api/feedback', feedbackRouter);

// GET /api/scholarships/recommended (matching user profile or query)
app.get('/api/scholarships/recommended', optionalAuth, async (req, res, next) => {
  try {
    let degreeLevel = req.query.level;
    let targetCountries = req.query.country ? [req.query.country] : [];
    let fields = req.query.field ? [req.query.field] : [];

    // If authenticated, personalize based on user profile
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).lean();
      if (user && user.profile) {
        if (!degreeLevel && user.profile.degreeLevel) {
          degreeLevel = user.profile.degreeLevel;
        }
        if (targetCountries.length === 0 && Array.isArray(user.profile.targetCountries)) {
          targetCountries = user.profile.targetCountries;
        }
        if (fields.length === 0 && Array.isArray(user.profile.fieldsOfStudy)) {
          fields = user.profile.fieldsOfStudy;
        }
      }
    }

    const conditions = [];

    if (degreeLevel && degreeLevel !== 'All Types' && degreeLevel !== 'All levels') {
      conditions.push({ study_levels: new RegExp(escapeRegex(String(degreeLevel)), 'i') });
    }

    if (targetCountries.length > 0) {
      const countryRegexes = targetCountries.map((c) => new RegExp(escapeRegex(c), 'i'));
      conditions.push({
        $or: [
          { country: { $in: countryRegexes } },
          { eligible_countries: { $in: countryRegexes } },
        ],
      });
    }

    if (fields.length > 0) {
      const fieldRegexes = fields.map((f) => new RegExp(escapeRegex(f), 'i'));
      conditions.push({ fields_of_study: { $in: fieldRegexes } });
    }

    let filter = {};
    if (conditions.length > 0) {
      filter.$or = conditions;
    }

    let data = await Scholarship.find(filter).select('-__v').limit(20).lean();

    // Fallback if filter returned too few results
    if (data.length < 5) {
      const fallback = await Scholarship.find().select('-__v').limit(20).lean();
      data = fallback;
    }

    res.json({ data, count: data.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/scholarships (search & filter)
app.get('/api/scholarships', async (req, res, next) => {
  try {
    const { q, country, level, field, eligibleCountry } = req.query;
    const filter = {};

    if (country) filter.country = new RegExp(escapeRegex(String(country)), 'i');
    if (level) filter.study_levels = new RegExp(escapeRegex(String(level)), 'i');
    if (field) filter.fields_of_study = new RegExp(escapeRegex(String(field)), 'i');
    if (eligibleCountry) {
      filter.eligible_countries = new RegExp(escapeRegex(String(eligibleCountry)), 'i');
    }
    if (q) {
      filter.$or = [
        'title',
        'provider_name',
        'country',
        'study_levels',
        'fields_of_study',
        'eligible_countries',
        'award_amount',
      ].map((k) => ({ [k]: new RegExp(escapeRegex(String(q)), 'i') }));
    }

    const data = await Scholarship.find(filter).select('-__v').sort({ title: 1 }).lean();
    res.json({ data, count: data.length });
  } catch (e) {
    next(e);
  }
});

// GET /api/scholarships/:id (single scholarship)
app.get('/api/scholarships/:id', async (req, res, next) => {
  try {
    const data = await Scholarship.findOne({ id: req.params.id }).select('-__v').lean();
    if (!data) return res.status(404).json({ error: 'Scholarship not found' });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[backend] Request failed:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = Number(process.env.PORT || 4000);
if (!process.env.MONGODB_URI) {
  console.error(
    'MongoDB configuration error: MONGODB_URI is required. Set it in backend/.env using the Atlas connection string.'
  );
  process.exit(1);
}

mongoose.connection.on('connected', () => console.info('[mongodb] Atlas connection established.'));
mongoose.connection.on('reconnected', () => console.info('[mongodb] Atlas connection restored.'));
mongoose.connection.on('disconnected', () => console.error('[mongodb] Connection lost; waiting for reconnection.'));
mongoose.connection.on('error', (error) => console.error('[mongodb] Connection error:', error.message));

async function start() {
  let delayMs = 1000;
  while (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    } catch (error) {
      console.error(`[mongodb] Initial connection failed: ${error.message}`);
      console.info(`[mongodb] Retrying in ${Math.round(delayMs / 1000)}s. Check Atlas Network Access, DNS, and credentials.`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 2, 30000);
    }
  }

  app.listen(port, () => console.info(`[backend] CollabX API listening on port ${port}.`));
}

start();
