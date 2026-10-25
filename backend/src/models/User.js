const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      required: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "firebase", "google", "apple"],
      default: "firebase",
    },
    profile: {
      photoURL: {
        type: String,
      },
      photoPublicId: {
        type: String,
      },
      avatarUrl: {
        type: String,
      },
      headline: {
        type: String,
      },
      degreeLevel: {
        type: String,
        enum: [
          "Bachelor's",
          "Master's",
          "PhD",
          "Postdoc",
          "High School",
          "Other",
        ],
      },
      cgpa: {
        type: Number,
        min: 0,
      },
      cgpaScale: {
        type: Number,
        min: 0.01,
        max: 100,
      },
      nationality: {
        type: String,
      },
      targetCountries: {
        type: [String],
        default: [],
      },
      fieldsOfStudy: {
        type: [String],
        default: [],
      },
      languages: {
        type: [String],
        default: [],
      },
      resumes: [
        {
          fileName: { type: String, required: true },
          fileUrl: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

module.exports = mongoose.model("User", userSchema);
