const express = require('express');
const multer = require('multer');
const Feedback = require('../models/Feedback');
const { requireAuth } = require('../middleware/auth');
const { deleteImage, uploadImage } = require('../services/imageStorage');

const router = express.Router();
const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!extensions[file.mimetype]) return callback(new Error('Screenshot must be JPG, PNG, or WebP.'));
    callback(null, true);
  },
});

router.post('/', requireAuth, (req, res, next) => {
  upload.single('photo')(req, res, (error) => {
    if (error) {
      return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        error: error.code === 'LIMIT_FILE_SIZE' ? 'Screenshot must be 5 MB or smaller.' : error.message,
      });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const { topic, message, replyEmail } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Choose a rating from 1 to 5.' });
    }
    if (!topic || !message || !String(message).trim()) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'A topic and message are required.' });
    }
    let uploadedScreenshot;
    try {
      if (req.file) uploadedScreenshot = await uploadImage(req.file.buffer, `feedback/${req.user.id}`);
      const feedback = await Feedback.create({
        userId: req.user.id,
        rating,
        topic: String(topic).slice(0, 80),
        message: String(message).trim().slice(0, 500),
        replyEmail: String(replyEmail || '').trim(),
        ...(uploadedScreenshot ? {
          screenshotUrl: uploadedScreenshot.url,
          screenshotPublicId: uploadedScreenshot.publicId,
        } : {}),
      });
      res.status(201).json({ message: 'Feedback sent successfully.', id: feedback._id });
    } catch (error) {
      if (uploadedScreenshot) await deleteImage(uploadedScreenshot.publicId).catch(() => {});
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
