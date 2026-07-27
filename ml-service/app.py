from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import traceback

# ============================================================
# 🌱 EDUSUSTAIN AI - MACHINE LEARNING API
# ============================================================

app = Flask(__name__)

# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)

# ============================================================
# MODEL LOCATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)

# ============================================================
# GLOBAL VARIABLES
# ============================================================

model = None
features = []

# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    global model
    global features

    print("")
    print("========================================")
    print("🌱 EDUSUSTAIN AI ML SERVICE")
    print("========================================")

    print("Looking for model at:")
    print(MODEL_PATH)

    if not os.path.exists(MODEL_PATH):

        print("❌ ERROR: model.pkl NOT FOUND")

        print(
            "Please put model.pkl inside ml-service folder."
        )

        model = None
        features = []

        return

    try:

        package = joblib.load(
            MODEL_PATH
        )

        # ====================================================
        # NEW MODEL FORMAT
        # ====================================================

        if isinstance(package, dict):

            model = package.get(
                "model"
            )

            features = package.get(
                "features",
                []
            )

        # ====================================================
        # OLD MODEL FORMAT
        # ====================================================

        else:

            model = package
            features = []

        # ====================================================
        # IF FEATURES ARE NOT SAVED
        # TRY TO READ FROM MODEL
        # ====================================================

        if not features:

            if hasattr(
                model,
                "feature_names_in_"
            ):

                features = list(
                    model.feature_names_in_
                )

        # ====================================================
        # MODEL INFO
        # ====================================================

        print("")
        print("✅ AI MODEL LOADED SUCCESSFULLY")

        print(
            "Model Type:",
            type(model).__name__
        )

        print(
            "Saved Features:",
            features
        )

        if hasattr(
            model,
            "n_features_in_"
        ):

            print(
                "Expected Feature Count:",
                model.n_features_in_
            )

        if hasattr(
            model,
            "feature_names_in_"
        ):

            print(
                "Model Feature Names:",
                list(
                    model.feature_names_in_
                )
            )

        print(
            "========================================"
        )

    except Exception as error:

        print(
            "❌ MODEL LOADING FAILED"
        )

        print(
            str(error)
        )

        traceback.print_exc()

        model = None
        features = []


# ============================================================
# LOAD MODEL AT START
# ============================================================

load_model()


# ============================================================
# HOME
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "success": True,

        "service":
        "EduSustain AI ML Service",

        "message":
        "AI Service is Running 🤖",

        "modelLoaded":
        model is not None,

        "features":
        features,

        "expectedFeatures":
        getattr(
            model,
            "n_features_in_",
            None
        ),

        "modelFeatureNames":
        list(
            model.feature_names_in_
        )
        if hasattr(
            model,
            "feature_names_in_"
        )
        else []

    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success":
        True,

        "status":
        "online",

        "modelLoaded":
        model is not None,

        "features":
        features,

        "expectedFeatures":
        getattr(
            model,
            "n_features_in_",
            None
        ),

        "modelFeatureNames":
        list(
            model.feature_names_in_
        )
        if hasattr(
            model,
            "feature_names_in_"
        )
        else []

    })


# ============================================================
# SAFE NUMBER
# ============================================================

def safe_number(value):

    try:

        if value is None:
            return 0.0

        if isinstance(
            value,
            str
        ):

            value = (
                value
                .replace(
                    ",",
                    ""
                )
                .strip()
            )

            if value == "":
                return 0.0

        number = float(
            value
        )

        if np.isnan(number):
            return 0.0

        if np.isinf(number):
            return 0.0

        return number

    except Exception:

        return 0.0


# ============================================================
# PREDICT
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        print("")
        print(
            "========================================"
        )

        print(
            "🤖 NEW AI ANALYSIS REQUEST"
        )

        print(
            "========================================"
        )

        # ====================================================
        # CHECK MODEL
        # ====================================================

        if model is None:

            return jsonify({

                "success":
                False,

                "message":
                "AI model is not loaded. Please check model.pkl."

            }), 500

        # ====================================================
        # READ REQUEST
        # ====================================================

        data = request.get_json(
            silent=True
        )

        print(
            "Received Data:"
        )

        print(
            data
        )

        if not data:

            return jsonify({

                "success":
                False,

                "message":
                "No input data received."

            }), 400

        # ====================================================
        # SCHOOL NAME
        # ====================================================

        school_name = data.get(

            "schoolName",

            "Unknown School"

        )

        # ====================================================
        # READ STUDENTS
        # ====================================================

        students = safe_number(

            data.get(

                "students",

                data.get(

                    "totalStudents",

                    0

                )

            )

        )

        # ====================================================
        # READ WATER
        # ====================================================

        water = safe_number(

            data.get(

                "waterConsumption",

                data.get(

                    "water",

                    0

                )

            )

        )

        # ====================================================
        # READ ELECTRICITY
        # ====================================================

        electricity = safe_number(

            data.get(

                "electricityConsumption",

                data.get(

                    "electricity",

                    0

                )

            )

        )

        # ====================================================
        # READ GREEN AREA
        # ====================================================

        green_area = safe_number(

            data.get(

                "greenArea",

                data.get(

                    "green_area",

                    0

                )

            )

        )

        # ====================================================
        # READ WASTE
        # ====================================================

        waste = safe_number(

            data.get(

                "wasteGenerated",

                data.get(

                    "waste",

                    0

                )

            )

        )

        # ====================================================
        # LOG INPUT
        # ====================================================

        print("")
        print(
            "School:",
            school_name
        )

        print(
            "Students:",
            students
        )

        print(
            "Water:",
            water
        )

        print(
            "Electricity:",
            electricity
        )

        print(
            "Green Area:",
            green_area
        )

        print(
            "Waste:",
            waste
        )

        # ====================================================
        # ALL POSSIBLE FEATURE NAMES
        # ====================================================

        input_values = {

            # Students
            "students":
            students,

            "students_numeric":
            students,

            "total_students":
            students,

            "totalStudents":
            students,


            # Water
            "water":
            water,

            "water_numeric":
            water,

            "water_consumption":
            water,

            "waterConsumption":
            water,


            # Electricity
            "electricity":
            electricity,

            "electricity_numeric":
            electricity,

            "electricity_consumption":
            electricity,

            "electricityConsumption":
            electricity,


            # Green Area
            "green_area":
            green_area,

            "green_area_numeric":
            green_area,

            "greenArea":
            green_area,


            # Waste
            "waste":
            waste,

            "waste_numeric":
            waste,

            "waste_generated":
            waste,

            "wasteGenerated":
            waste

        }

        # ====================================================
        # 🔥 FIXED MODEL INPUT
        # ====================================================

        print("")
        print(
            "🔧 BUILDING MODEL INPUT..."
        )

        # ====================================================
        # FIRST PRIORITY:
        # USE ACTUAL MODEL FEATURE NAMES
        # ====================================================

        model_features = []

        if hasattr(
            model,
            "feature_names_in_"
        ):

            model_features = list(
                model.feature_names_in_
            )

            print(
                "Using feature names directly from trained model:"
            )

            print(
                model_features
            )

        # ====================================================
        # SECOND PRIORITY:
        # USE SAVED FEATURES
        # ====================================================

        elif features:

            model_features = list(
                features
            )

            print(
                "Using saved model features:"
            )

            print(
                model_features
            )

        # ====================================================
        # THIRD PRIORITY:
        # DEFAULT FEATURE NAMES
        # ====================================================

        else:

            model_features = [

                "students",

                "waterConsumption",

                "electricityConsumption",

                "greenArea",

                "wasteGenerated"

            ]

            print(
                "No feature names found."
            )

            print(
                "Using default model features:"
            )

            print(
                model_features
            )

        # ====================================================
        # BUILD ROW
        # ====================================================

        row = {}

        for feature in model_features:

            if feature in input_values:

                row[
                    feature
                ] = input_values[
                    feature
                ]

            else:

                print(
                    "⚠️ Unknown model feature:",
                    feature
                )

                row[
                    feature
                ] = 0.0

        # ====================================================
        # CREATE DATAFRAME
        # ====================================================

        input_df = pd.DataFrame(

            [row],

            columns=model_features

        )

        # ====================================================
        # SHOW MODEL INPUT
        # ====================================================

        print("")
        print(
            "========================================"
        )

        print(
            "📊 MODEL INPUT"
        )

        print(
            "========================================"
        )

        print(
            input_df
        )

        print(
            "Input Columns:",
            list(
                input_df.columns
            )
        )

        print(
            "Input Shape:",
            input_df.shape
        )

        print(
            "========================================"
        )

        # ====================================================
        # EXPECTED FEATURE COUNT
        # ====================================================

        expected_features = getattr(

            model,

            "n_features_in_",

            None

        )

        # ====================================================
        # FEATURE COUNT CHECK
        # ====================================================

        if (

            expected_features
            is not None

            and

            input_df.shape[1]
            != expected_features

        ):

            print("")
            print(
                "❌ FEATURE COUNT MISMATCH"
            )

            print(
                "Expected:",
                expected_features
            )

            print(
                "Received:",
                input_df.shape[1]
            )

            return jsonify({

                "success":
                False,

                "message":
                "AI model feature count mismatch.",

                "expectedFeatures":
                expected_features,

                "receivedFeatures":
                input_df.shape[1],

                "modelFeatures":
                model_features,

                "solution":
                "The input feature count does not match the trained model."

            }), 500

        # ====================================================
        # RUN PREDICTION
        # ====================================================

        print("")
        print(
            "🤖 Running AI Prediction..."
        )

        prediction = model.predict(

            input_df

        )[0]

        print(
            "Raw Prediction:",
            prediction
        )

        # ====================================================
        # CONVERT SCORE
        # ====================================================

        try:

            score = float(
                prediction
            )

        except Exception:

            score = 0.0

        # ====================================================
        # KEEP SCORE BETWEEN 0 AND 100
        # ====================================================

        score = max(

            0,

            min(

                100,

                score

            )

        )

        score = round(

            score,

            2

        )

        # ====================================================
        # RISK LEVEL
        # ====================================================

        if score >= 80:

            risk = "Low"

        elif score >= 60:

            risk = "Medium"

        else:

            risk = "High"

        # ====================================================
        # RECOMMENDATIONS
        # ====================================================

        recommendations = []

        # ====================================================
        # WATER
        # ====================================================

        if students > 0:

            water_per_student = (

                water
                /
                students

            )

            if water_per_student > 25:

                recommendations.append(

                    "Reduce water consumption and check for leakage."

                )

        # ====================================================
        # ELECTRICITY
        # ====================================================

        if students > 0:

            electricity_per_student = (

                electricity
                /
                students

            )

            if electricity_per_student > 16:

                recommendations.append(

                    "Improve electricity efficiency using LED lighting and energy monitoring."

                )

        # ====================================================
        # GREEN AREA
        # ====================================================

        if green_area < 20:

            recommendations.append(

                "Increase green areas and plantation around the school campus."

            )

        # ====================================================
        # WASTE
        # ====================================================

        if students > 0:

            waste_per_student = (

                waste
                /
                students

            )

            if waste_per_student > 1.5:

                recommendations.append(

                    "Improve waste segregation and recycling."

                )

        # ====================================================
        # GOOD PERFORMANCE
        # ====================================================

        if len(
            recommendations
        ) == 0:

            recommendations.append(

                "School sustainability performance is good. Continue current practices."

            )

        # ====================================================
        # FINAL RESULT
        # ====================================================

        result = {

            "success":
            True,

            "schoolName":
            school_name,

            "sustainabilityScore":
            score,

            "score":
            score,

            "riskLevel":
            risk,

            "risk":
            risk,

            "recommendations":
            recommendations,

            "input":
            {

                "students":
                students,

                "waterConsumption":
                water,

                "electricityConsumption":
                electricity,

                "greenArea":
                green_area,

                "wasteGenerated":
                waste

            }

        }

        # ====================================================
        # SUCCESS LOG
        # ====================================================

        print("")
        print(
            "========================================"
        )

        print(
            "✅ AI ANALYSIS COMPLETED"
        )

        print(
            "School:",
            school_name
        )

        print(
            "Score:",
            score
        )

        print(
            "Risk:",
            risk
        )

        print(
            "Recommendations:",
            recommendations
        )

        print(
            "========================================"
        )

        return jsonify(

            result

        ), 200

    # ========================================================
    # ERROR HANDLER
    # ========================================================

    except Exception as error:

        print("")
        print(
            "========================================"
        )

        print(
            "❌ AI PREDICTION ERROR"
        )

        print(
            str(error)
        )

        print(
            "========================================"
        )

        traceback.print_exc()

        return jsonify({

            "success":
            False,

            "message":
            "Prediction failed.",

            "error":
            str(error)

        }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print("")
    print(
        "========================================"
    )

    print(
        "🌱 EDUSUSTAIN AI ML SERVER STARTING"
    )

    print(
        "========================================"
    )

    print(
        "🌐 Server:"
    )

    print(
        "http://localhost:8000"
    )

    print("")

    print(
        "❤️ Health:"
    )

    print(
        "http://localhost:8000/health"
    )

    print("")

    print(
        "🤖 Prediction:"
    )

    print(
        "http://localhost:8000/predict"
    )

    print(
        "========================================"
    )

    app.run(

        host="0.0.0.0",

        port=8000,

        debug=True

    )