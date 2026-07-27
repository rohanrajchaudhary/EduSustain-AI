const mongoose = require("mongoose");

// =====================================================
// SCHOOL DATA SCHEMA
// =====================================================

const schoolDataSchema = new mongoose.Schema(
  {
    // =====================================================
    // 🏫 SCHOOL NAME
    // =====================================================

    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // 👨‍🎓 TOTAL STUDENTS
    // =====================================================

    students: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // 💧 WATER CONSUMPTION
    // =====================================================

    waterConsumption: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // ⚡ ELECTRICITY CONSUMPTION
    // =====================================================

    electricityConsumption: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // 🌳 GREEN AREA
    // =====================================================

    greenArea: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // 🗑️ WASTE GENERATED
    // =====================================================

    wasteGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // 📁 ORIGINAL UPLOADED FILE NAME
    // =====================================================

    sourceFile: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // 👤 USER WHO UPLOADED THE DATA
    // =====================================================

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // 🤖 AI SUSTAINABILITY SCORE
    // =====================================================

    sustainabilityScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // =====================================================
    // ⚠️ AI RISK LEVEL
    // =====================================================

    riskLevel: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Not Analyzed",
      ],
      default: "Not Analyzed",
    },

    // =====================================================
    // 💡 AI RECOMMENDATIONS
    // =====================================================

    aiRecommendations: {
      type: [String],
      default: [],
    },

    // =====================================================
    // 🤖 AI ANALYSIS STATUS
    // =====================================================

    aiAnalyzed: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // 🕒 AI ANALYSIS DATE
    // =====================================================

    aiAnalyzedAt: {
      type: Date,
      default: null,
    },
  },

  // =====================================================
  // AUTOMATIC CREATED & UPDATED TIMESTAMP
  // =====================================================

  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

// User ke data ko quickly find karne ke liye
schoolDataSchema.index({
  uploadedBy: 1,
  createdAt: -1,
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
  "SchoolData",
  schoolDataSchema
);