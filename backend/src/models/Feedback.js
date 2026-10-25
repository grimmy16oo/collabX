const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  topic: { type: String, required: true, trim: true, maxlength: 80 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  replyEmail: { type: String, trim: true, maxlength: 254 },
  screenshotUrl: { type: String },
  screenshotPublicId: { type: String },
}, { timestamps: true, collection: 'feedback' });

module.exports = mongoose.model('Feedback', feedbackSchema);
