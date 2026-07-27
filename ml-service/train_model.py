import os
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score


# =====================================================
# PATHS
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "combined_school_dataset.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)


# =====================================================
# CHECK FILE
# =====================================================

print("\n==========================================")
print("EDUSUSTAIN AI - REAL DATA MODEL TRAINING")
print("==========================================\n")

print("Looking for dataset:")
print(DATA_PATH)


if not os.path.exists(DATA_PATH):

    print("\n❌ DATASET NOT FOUND")

    print("\nPlease put this file here:")
    print(DATA_PATH)

    raise SystemExit


print("\n✓ Dataset found")


# =====================================================
# LOAD DATA
# =====================================================

try:

    df = pd.read_csv(
        DATA_PATH,
        encoding="utf-8-sig"
    )

except Exception as error:

    print("\n❌ Failed to load dataset")

    print(error)

    raise SystemExit


print("\n✓ Dataset loaded successfully")

print("Rows:", len(df))

print("Columns:", len(df.columns))


# =====================================================
# CLEAN COLUMN NAMES
# =====================================================

df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
    .str.replace("/", "_")
    .str.replace("(", "")
    .str.replace(")", "")
    .str.replace("?", "")
)


print("\nCleaned Columns:")

for column in df.columns:

    print("-", column)


# =====================================================
# FEATURE DETECTION
# =====================================================

feature_candidates = {

    "students": [
        "total_students",
        "students"
    ],

    "water": [
        "approx._daily_water_consumption_litres",
        "approx_daily_water_consumption_litres",
        "water_consumption",
        "waterconsumption"
    ],

    "electricity": [
        "electricity_consumption",
        "electricity"
    ],

    "green_area": [
        "green_area",
        "roof_area_m²",
        "roof_area_m²"
    ],

    "waste": [
        "waste_generated",
        "waste"
    ]

}


# =====================================================
# FIND AVAILABLE FEATURES
# =====================================================

selected_features = []

feature_mapping = {}


for feature_name, candidates in feature_candidates.items():

    for candidate in candidates:

        if candidate in df.columns:

            selected_features.append(candidate)

            feature_mapping[
                feature_name
            ] = candidate

            break


print("\n==========================================")
print("FEATURE DETECTION")
print("==========================================")

for key, value in feature_mapping.items():

    print(
        f"✓ {key} -> {value}"
    )


# =====================================================
# CHECK FEATURES
# =====================================================

if len(selected_features) < 2:

    print("\n❌ Not enough usable features.")

    print(
        "At least 2 numeric sustainability features are required."
    )

    raise SystemExit


# =====================================================
# CREATE SUSTAINABILITY SCORE
# =====================================================
#
# IMPORTANT:
# Your public UDISE data does NOT contain a real
# sustainability score.
#
# Therefore we create a transparent proxy score
# from infrastructure indicators.
#
# This is NOT fake training data.
#
# It is a derived target based on available data.
#
# =====================================================


def calculate_score(row):

    score_parts = []


    # ---------------------------------------------
    # ELECTRICITY
    # ---------------------------------------------

    if "electricity" in feature_mapping:

        value = row[
            feature_mapping["electricity"]
        ]

        if pd.notna(value):

            score_parts.append(
                min(
                    max(
                        float(value),
                        0
                    ),
                    100
                )
            )


    # ---------------------------------------------
    # GREEN AREA
    # ---------------------------------------------

    if "green_area" in feature_mapping:

        value = row[
            feature_mapping["green_area"]
        ]

        if pd.notna(value):

            score_parts.append(
                min(
                    max(
                        float(value),
                        0
                    ),
                    100
                )
            )


    # ---------------------------------------------
    # WATER
    # ---------------------------------------------

    if "water" in feature_mapping:

        value = row[
            feature_mapping["water"]
        ]

        if pd.notna(value):

            score_parts.append(
                min(
                    max(
                        100 - (
                            float(value) / 10000
                        ),
                        0
                    ),
                    100
                )
            )


    # ---------------------------------------------
    # DEFAULT
    # ---------------------------------------------

    if len(score_parts) == 0:

        return np.nan


    return np.mean(
        score_parts
    )


# =====================================================
# CREATE TARGET
# =====================================================

print("\nCreating sustainability score...")

df["sustainability_score"] = df.apply(
    calculate_score,
    axis=1
)


# =====================================================
# NUMERIC CONVERSION
# =====================================================

for column in selected_features:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# =====================================================
# REMOVE INVALID ROWS
# =====================================================

model_columns = (
    selected_features
    + ["sustainability_score"]
)


df_model = df[
    model_columns
].dropna()


print(
    "\nUsable training rows:",
    len(df_model)
)


if len(df_model) < 5:

    print(
        "\n❌ Not enough clean rows to train."
    )

    print(
        "Your current combined dataset needs more numeric school-level data."
    )

    raise SystemExit


# =====================================================
# FEATURES & TARGET
# =====================================================

X = df_model[
    selected_features
]

y = df_model[
    "sustainability_score"
]


# =====================================================
# TRAIN TEST SPLIT
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.2,

    random_state=42

)


# =====================================================
# MODEL
# =====================================================

model = RandomForestRegressor(

    n_estimators=300,

    random_state=42,

    max_depth=10,

    min_samples_leaf=2

)


# =====================================================
# TRAIN
# =====================================================

print(
    "\n🤖 Training Random Forest..."
)


model.fit(

    X_train,

    y_train

)


# =====================================================
# EVALUATE
# =====================================================

predictions = model.predict(

    X_test

)


mae = mean_absolute_error(

    y_test,

    predictions

)


r2 = r2_score(

    y_test,

    predictions

)


print(
    "\n=========================================="
)

print(
    "MODEL TRAINING COMPLETE ✅"
)

print(
    "=========================================="
)

print(
    "MAE:",
    round(
        mae,
        2
    )
)

print(
    "R² Score:",
    round(
        r2,
        2
    )
)


# =====================================================
# SAVE MODEL + METADATA
# =====================================================

model_package = {

    "model":
    model,

    "features":
    selected_features,

    "feature_mapping":
    feature_mapping,

    "mae":
    mae,

    "r2":
    r2

}


joblib.dump(

    model_package,

    MODEL_PATH

)


print(
    "\n✓ Model saved:"
)

print(
    MODEL_PATH
)


print(
    "\n🚀 REAL DATA TRAINING PIPELINE COMPLETED"
)