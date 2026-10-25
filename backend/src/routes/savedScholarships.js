const express = require('express');
const SavedScholarship = require('../models/SavedScholarship');
const Scholarship = require('../models/Scholarship');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/saved-scholarships
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const savedRecords = await SavedScholarship.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const scholarshipIds = savedRecords.map((r) => r.scholarshipId);
    const scholarships = await Scholarship.find({ id: { $in: scholarshipIds } })
      .select('-__v')
      .lean();

    const scholarshipMap = new Map(scholarships.map((s) => [s.id, s]));

    const data = savedRecords
      .map((record) => {
        const scholarship = scholarshipMap.get(record.scholarshipId);
        if (!scholarship) return null;
        return {
          ...scholarship,
          tracker: {
            _id: record._id,
            status: record.status,
            notes: record.notes,
            reminderDate: record.reminderDate,
            savedAt: record.createdAt,
          },
        };
      })
      .filter(Boolean);

    res.json({
      data,
      savedIds: scholarshipIds,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/saved-scholarships/toggle
router.post('/toggle', requireAuth, async (req, res, next) => {
  try {
    const { scholarshipId } = req.body;
    if (!scholarshipId) {
      return res.status(400).json({ error: 'scholarshipId is required.' });
    }

    const existing = await SavedScholarship.findOne({
      userId: req.user.id,
      scholarshipId,
    });

    if (existing) {
      await SavedScholarship.deleteOne({ _id: existing._id });
      return res.json({ isSaved: false, scholarshipId });
    }

    const newRecord = await SavedScholarship.create({
      userId: req.user.id,
      scholarshipId,
      status: 'saved',
    });

    res.status(201).json({
      isSaved: true,
      scholarshipId,
      tracker: newRecord,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/saved-scholarships/:scholarshipId
router.patch('/:scholarshipId', requireAuth, async (req, res, next) => {
  try {
    const { status, notes, reminderDate } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (reminderDate !== undefined) update.reminderDate = reminderDate;

    const record = await SavedScholarship.findOneAndUpdate(
      { userId: req.user.id, scholarshipId: req.params.scholarshipId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Tracker updated successfully.',
      tracker: record,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/saved-scholarships/:scholarshipId
router.delete('/:scholarshipId', requireAuth, async (req, res, next) => {
  try {
    await SavedScholarship.deleteOne({
      userId: req.user.id,
      scholarshipId: req.params.scholarshipId,
    });
    res.json({ message: 'Scholarship removed from tracker.', scholarshipId: req.params.scholarshipId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
