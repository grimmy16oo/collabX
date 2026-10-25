const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const Scholarship = require('./models/Scholarship');

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in backend/.env.');
  }

  const file = path.resolve(__dirname, '../../src/data/scholarships.json');
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(records)) throw new Error('Scholarship source JSON must be an array.');

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    console.error(`[mongodb] Could not connect for import: ${error.message}`);
    throw error;
  }

  const ops = records.map((record) => ({
    updateOne: { filter: { id: record.id }, update: { $set: record, $unset: { image_url: 1 } }, upsert: true },
  }));
  const result = ops.length ? await Scholarship.bulkWrite(ops, { ordered: false }) : {};
  console.log(JSON.stringify({
    sourceRecords: records.length,
    inserted: result.upsertedCount || 0,
    updated: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
    collection: 'scholarships',
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[backend] Scholarship import failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
