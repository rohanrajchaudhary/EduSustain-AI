const express = require("express");

const router = express.Router();

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ||
  "http://localhost:8000";

// ========================================
// ML SERVICE HEALTH CHECK
// ========================================

router.get("/health", async (req, res) => {
  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/`
    );

    const data = await response.json();

    res.json({
      success: true,
      backend: "Online",
      mlService: data,
    });
  } catch (error) {
    console.error(
      "ML HEALTH ERROR:",
      error.message
    );

    res.status(503).json({
      success: false,
      message: "ML Service is not running",
      mlServiceUrl: ML_SERVICE_URL,
    });
  }
});

// ========================================
// AI PREDICTION
// ========================================

router.post("/predict", async (req, res) => {
  try {
    const {
      students,
      waterConsumption,
      electricityConsumption,
      greenArea,
      wasteGenerated,
    } = req.body;

    const response = await fetch(
      `${ML_SERVICE_URL}/predict`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          students: Number(students) || 0,

          waterConsumption:
            Number(waterConsumption) || 0,

          electricityConsumption:
            Number(electricityConsumption) || 0,

          greenArea:
            Number(greenArea) || 0,

          wasteGenerated:
            Number(wasteGenerated) || 0,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data.message ||
          "ML prediction failed",
        error: data.error,
      });
    }

    res.json({
      success: true,
      prediction: data,
    });
  } catch (error) {
    console.error(
      "ML PREDICTION ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not connect to ML service",
      error: error.message,
    });
  }
});

module.exports = router;