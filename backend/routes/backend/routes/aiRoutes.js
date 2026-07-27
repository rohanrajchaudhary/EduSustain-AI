const express = require("express");

const router = express.Router();


// ==========================================
// AI PREDICTION
// ==========================================

router.post("/predict", async (req, res) => {

  try {

    const {

      students = 0,

      waterConsumption = 0,

      electricityConsumption = 0,

      greenArea = 0,

      wasteGenerated = 0

    } = req.body;


    const response = await fetch(
      "http://127.0.0.1:8000/predict",
      {

        method: "POST",

        headers: {

          "Content-Type":
          "application/json"

        },

        body: JSON.stringify({

          students,

          waterConsumption,

          electricityConsumption,

          greenArea,

          wasteGenerated

        })

      }
    );


    const result =
      await response.json();


    if (!response.ok) {

      return res.status(
        response.status
      ).json(result);

    }


    res.json(result);


  } catch (error) {

    console.error(
      "AI ROUTE ERROR:",
      error
    );


    res.status(500).json({

      success: false,

      message:
      "Could not connect to AI ML service.",

      error:
      error.message

    });

  }

});


module.exports = router;