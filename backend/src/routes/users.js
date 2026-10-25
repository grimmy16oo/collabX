const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { deleteImage, uploadImage } = require('../services/imageStorage');

const router = express.Router();
const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
    callback(null, true);
  },
});

function parseAvatarUpload(req, res, next) {
  avatarUpload.single('photo')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Profile photos must be 5 MB or smaller.'
      : error.message || 'Could not process the uploaded photo.';
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: message });
  });
}

async function hasExpectedImageSignature(file) {
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return file.mimetype === 'image/webp' && bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
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

// GET /api/users/profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ profile: user.profile, fullName: user.fullName, email: user.email });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile
router.put('/profile', requireAuth, parseAvatarUpload, async (req, res, next) => {
  try {
    if (req.file && !(await hasExpectedImageSignature(req.file))) {
      return res.status(400).json({ error: 'The uploaded file is not a valid JPG, PNG, or WebP image.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const previousPhotoPublicId = user.profile.photoPublicId;

    const {
      fullName,
      headline,
      degreeLevel,
      cgpa,
      cgpaScale,
      nationality,
      targetCountries,
      fieldsOfStudy,
      languages,
    } = req.body;

    if (fullName && fullName.trim()) user.fullName = fullName.trim();
    if (headline !== undefined) user.profile.headline = headline;
    if (degreeLevel !== undefined) user.profile.degreeLevel = degreeLevel || undefined;
    if (cgpa !== undefined) {
      const parsedCgpa = cgpa === null || cgpa === '' ? undefined : Number(cgpa);
      const parsedScale = cgpaScale === null || cgpaScale === '' ? undefined : Number(cgpaScale);
      if (parsedCgpa !== undefined && (!Number.isFinite(parsedCgpa) || parsedCgpa < 0)) {
        return res.status(400).json({ error: 'CGPA must be a valid non-negative number.' });
      }
      if (parsedScale !== undefined && (!Number.isFinite(parsedScale) || parsedScale <= 0)) {
        return res.status(400).json({ error: 'CGPA scale must be a valid positive number.' });
      }
      if (parsedCgpa !== undefined && parsedScale !== undefined && parsedCgpa > parsedScale) {
        return res.status(400).json({ error: 'CGPA cannot be greater than its scale.' });
      }
      user.profile.cgpa = parsedCgpa;
    }
    if (cgpaScale !== undefined) {
      user.profile.cgpaScale = cgpaScale === null || cgpaScale === '' ? undefined : Number(cgpaScale);
    }
    if (nationality !== undefined) user.profile.nationality = nationality;
    if (Array.isArray(targetCountries)) user.profile.targetCountries = targetCountries;
    if (Array.isArray(fieldsOfStudy)) user.profile.fieldsOfStudy = fieldsOfStudy;
    if (Array.isArray(languages)) user.profile.languages = languages;
    let uploadedImage;
    if (req.file) {
      uploadedImage = await uploadImage(req.file.buffer, `avatars/${user.id}`);
      user.profile.photoURL = uploadedImage.url;
      user.profile.photoPublicId = uploadedImage.publicId;
    }

    try {
      await user.save();
    } catch (error) {
      if (uploadedImage) await deleteImage(uploadedImage.publicId).catch(() => {});
      throw error;
    }
    if (uploadedImage && previousPhotoPublicId) {
      await deleteImage(previousPhotoPublicId).catch((error) => {
        console.error('[images] Could not remove replaced profile photo:', error.message);
      });
    }
    res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
      ...(req.file ? { photoURL: user.profile.photoURL } : {}),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/resumes
router.post('/resumes', requireAuth, async (req, res, next) => {
  try {
    const { fileName, fileUrl } = req.body;
    if (!fileName || !fileUrl) {
      return res.status(400).json({ error: 'fileName and fileUrl are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.profile.resumes.push({ fileName, fileUrl, uploadedAt: new Date() });
    await user.save();

    res.status(201).json({
      message: 'Resume added successfully.',
      resumes: user.profile.resumes,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/resumes/:resumeId
router.delete('/resumes/:resumeId', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.profile.resumes = user.profile.resumes.filter(
      (r) => String(r._id) !== req.params.resumeId
    );
    await user.save();

    res.json({
      message: 'Resume removed successfully.',
      resumes: user.profile.resumes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
