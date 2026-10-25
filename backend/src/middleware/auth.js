const jwt = require('jsonwebtoken');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'collabx-super-secret-jwt-key-2026';

function getFirebaseAuth() {
  let app = getApps().find((candidate) => candidate.name === '[DEFAULT]');
  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required to verify Firebase ID tokens.');
    app = initializeApp({ projectId });
  }
  return getAuth(app);
}

function bearerToken(req) {
  const authHeader = req.headers.authorization;
  return authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
}

async function requireFirebaseAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  try {
    req.firebaseUser = await getFirebaseAuth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error('[auth] Firebase ID token verification failed:', err.code || 'unknown', err.message);
    if (err.message?.includes('FIREBASE_PROJECT_ID')) {
      return res.status(503).json({ error: err.message });
    }
    if (err.code === 'auth/certificate-fetch-failed' || err.code === 'app/network-error') {
      return res.status(503).json({ error: 'Firebase token verification is temporarily unavailable. Check backend connectivity and try again.' });
    }
    return res.status(401).json({ error: 'Invalid or expired Firebase session. Please sign in again.' });
  }
}

async function identifyRequestUser(token) {
  try {
    const legacyUser = jwt.verify(token, JWT_SECRET);
    return { firebaseUser: null, user: legacyUser };
  } catch {
    // Try a Firebase ID token after the existing API-issued token format.
  }
  try {
    const firebaseUser = await getFirebaseAuth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: firebaseUser.uid }).select('_id firebaseUid email').lean();
    if (!user) return { firebaseUser, user: null };
    return {
      firebaseUser,
      user: { id: String(user._id), firebaseUid: user.firebaseUid, email: user.email },
    };
  } catch {
    // Invalid token.
    return { firebaseUser: null, user: null };
  }
}

async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  try {
    const identity = await identifyRequestUser(token);
    if (!identity.user) {
      return res.status(401).json({ error: 'Invalid session or account is not synced. Please sign in again.' });
    }
    req.user = identity.user;
    req.firebaseUser = identity.firebaseUser;
    next();
  } catch (err) {
    next(err);
  }
}

function optionalAuth(req, _res, next) {
  const token = bearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }
  identifyRequestUser(token)
    .then((identity) => {
      req.user = identity.user;
      req.firebaseUser = identity.firebaseUser;
      next();
    })
    .catch(() => {
      req.user = null;
      next();
    });
}

module.exports = {
  requireAuth,
  requireFirebaseAuth,
  optionalAuth,
  JWT_SECRET,
};
