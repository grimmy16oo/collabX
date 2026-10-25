const mongoose = require('mongoose');

const savedScholarshipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scholarshipId: {
      type: String,
      ref: 'Scholarship',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['saved', 'preparing', 'applied', 'interviewing', 'awarded', 'rejected'],
      default: 'saved',
    },
    notes: {
      type: String,
      default: '',
    },
    reminderDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'saved_scholarships',
  }
);

savedScholarshipSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });

module.exports = mongoose.model('SavedScholarship', savedScholarshipSchema);
