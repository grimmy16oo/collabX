const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, requireFirebaseAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const LEGACY_PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
const LEGACY_TARGET_COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Germany'];
const LEGACY_FIELDS_OF_STUDY = ['Computer Science', 'Data Science', 'Engineering'];

function isSameList(value, expected) {
  return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]);
}

function clearLegacyProfileDefaults(profile) {
  if (!profile) return;
  const isUntouchedDemoProfile =
    profile.headline === 'COMPUTER SCIENCE UNDERGRAD' &&
    profile.degreeLevel === "Bachelor's" &&
    profile.cgpa === 3.85 &&
    profile.cgpaScale === 4 &&
    profile.nationality === 'Bangladesh' &&
    isSameList(profile.targetCountries, LEGACY_TARGET_COUNTRIES) &&
    isSameList(profile.fieldsOfStudy, LEGACY_FIELDS_OF_STUDY);

  if (isUntouchedDemoProfile) {
    if (profile.avatarUrl === LEGACY_PLACEHOLDER_AVATAR) profile.avatarUrl = undefined;
    if (profile.photoURL === LEGACY_PLACEHOLDER_AVATAR) profile.photoURL = undefined;
    profile.headline = undefined;
    profile.degreeLevel = undefined;
    profile.cgpa = undefined;
    profile.cgpaScale = undefined;
    profile.nationality = undefined;
    profile.targetCountries = [];
    profile.fieldsOfStudy = [];
  }
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    authProvider: user.authProvider,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/firebase-sync (Syncs Firebase Auth user with MongoDB)
router.post('/firebase-sync', requireFirebaseAuth, async (req, res, next) => {
  try {
    const { fullName } = req.body;
    const firebaseUid = req.firebaseUser.uid;
    const email = req.firebaseUser.email;
    const photoURL = req.firebaseUser.picture;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required.' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prefer the Firebase UID, then link an existing legacy account by email.
    let user = await User.findOne({ firebaseUid });
    if (!user) user = await User.findOne({ email: cleanEmail });

    if (!user) {
      try {
        user = await User.create({
          firebaseUid,
          fullName: (fullName && fullName.trim()) || cleanEmail.split('@')[0],
          email: cleanEmail,
          authProvider: 'firebase',
          profile: photoURL ? { photoURL } : {},
        });
      } catch (createError) {
        // Auth state restoration and the explicit login/register call may sync
        // the same Firebase user concurrently. Reuse the winner of that race.
        if (createError.code !== 11000) throw createError;
        user = await User.findOne({ firebaseUid });
        if (!user) user = await User.findOne({ email: cleanEmail });
        if (!user) throw createError;
      }
    }

    if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
      return res.status(409).json({ error: 'This email is already linked to another Firebase account.' });
    }

    // Remove the exact demo values written by earlier versions of the profile defaults.
    clearLegacyProfileDefaults(user.profile);
    if (!user.firebaseUid) user.firebaseUid = firebaseUid;
    if (fullName && (!user.fullName || user.fullName === 'Student')) {
      user.fullName = fullName.trim();
    }
    if (photoURL && !user.profile.photoURL && (!user.profile.avatarUrl || user.profile.avatarUrl === LEGACY_PLACEHOLDER_AVATAR)) {
      user.profile.photoURL = photoURL;
    }
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, firebaseUid: user.firebaseUid },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Synced with Firebase user successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
