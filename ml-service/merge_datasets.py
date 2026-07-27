import pandas as pd
import os
import re
import unicodedata
from difflib import get_close_matches


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)


# =========================================================
# FILES
# =========================================================

SURVEY_FILE = os.path.join(
    DATA_DIR,
    "fixed",
    "survey_data_v2.csv"
)

if not os.path.exists(SURVEY_FILE):

    SURVEY_FILE = os.path.join(
        DATA_DIR,
        "survey_data_v2.csv"
    )


DATASETS = [

    "infrastructure_highlights.csv",

    "drinking_water.csv",

    "enrolment.csv",

    "infrastructure.csv",

]


# =========================================================
# NORMALIZE TEXT
# =========================================================

def normalize_text(value):

    if pd.isna(value):

        return ""

    value = str(value)

    value = unicodedata.normalize(
        "NFKD",
        value
    )

    value = (
        value
        .strip()
        .upper()
    )

    value = re.sub(
        r"[^A-Z0-9\s]",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


# =========================================================
# FIND DISTRICT COLUMN
# =========================================================

def find_district_columns(df):

    columns = []

    for col in df.columns:

        normalized = normalize_text(col)

        if (
            "DISTRICT" in normalized
            or "DISTRICT_NAME" in normalized
            or "DISTRICT_CODE" in normalized
        ):

            columns.append(col)

    return columns


# =========================================================
# LOAD SURVEY
# =========================================================

print("\n")
print("=" * 80)
print("LOADING SURVEY DATA")
print("=" * 80)

if not os.path.exists(SURVEY_FILE):

    raise FileNotFoundError(
        f"Survey file not found: {SURVEY_FILE}"
    )


survey = pd.read_csv(
    SURVEY_FILE,
    encoding="utf-8-sig",
    low_memory=False
)


print(
    "Survey rows:",
    len(survey)
)


print(
    "Survey columns:",
    list(survey.columns)
)


# =========================================================
# DETECT SURVEY DISTRICT
# =========================================================

survey_district_column = None

for col in survey.columns:

    if "district" in str(col).lower():

        survey_district_column = col

        break


if survey_district_column is None:

    raise ValueError(
        "Survey dataset does not contain district column."
    )


survey_district = normalize_text(
    survey[
        survey_district_column
    ].iloc[0]
)


print(
    "\nSurvey District:",
    survey_district
)


# =========================================================
# SAVE SURVEY COPY
# =========================================================

survey["_district_key"] = survey[
    survey_district_column
].apply(
    normalize_text
)


# =========================================================
# START MERGE
# =========================================================

merged = survey.copy()

matched_datasets = []

print("\n")
print("=" * 80)
print("SEARCHING FOR DISTRICT MATCHES")
print("=" * 80)


# =========================================================
# PROCESS DATASETS
# =========================================================

for filename in DATASETS:

    filepath = os.path.join(
        DATA_DIR,
        filename
    )


    print("\n")
    print("-" * 80)

    print(
        "PROCESSING:",
        filename
    )

    print("-" * 80)


    if not os.path.exists(filepath):

        print(
            "⚠️ File not found. Skipping."
        )

        continue


    try:

        df = pd.read_csv(
            filepath,
            encoding="utf-8-sig",
            low_memory=False
        )

    except Exception as error:

        print(
            "Normal CSV loading failed:",
            error
        )

        try:

            df = pd.read_csv(
                filepath,
                encoding="latin1",
                low_memory=False
            )

        except Exception as error2:

            print(
                "❌ Could not load file:",
                error2
            )

            continue


    print(
        "Rows:",
        len(df)
    )

    print(
        "Columns:",
        len(df.columns)
    )


    district_columns = find_district_columns(
        df
    )


    # =====================================================
    # REMOVE NON-DISTRICT COLUMNS
    # =====================================================

    valid_district_columns = []

    for col in district_columns:

        col_normalized = normalize_text(col)

        if (
            "CODE" not in col_normalized
            and "DISTRICT" in col_normalized
        ):

            valid_district_columns.append(
                col
            )


    print(
        "District columns:",
        valid_district_columns
    )


    # =====================================================
    # NO DISTRICT
    # =====================================================

    if len(valid_district_columns) == 0:

        print(
            "⚠️ No usable district name column."
        )

        print(
            "This dataset will NOT be blindly merged."
        )

        continue


    # =====================================================
    # SELECT DISTRICT COLUMN
    # =====================================================

    district_column = (
        valid_district_columns[0]
    )


    print(
        "Using district column:",
        district_column
    )


    df["_district_key"] = df[
        district_column
    ].apply(
        normalize_text
    )


    # =====================================================
    # SHOW DISTRICTS
    # =====================================================

    unique_districts = (
        df["_district_key"]
        .dropna()
        .unique()
        .tolist()
    )


    print(
        "Available district examples:"
    )

    print(
        unique_districts[:30]
    )


    # =====================================================
    # EXACT MATCH
    # =====================================================

    matched = df[
        df["_district_key"]
        == survey_district
    ].copy()


    # =====================================================
    # FUZZY MATCH
    # =====================================================

    if len(matched) == 0:

        possible_matches = get_close_matches(

            survey_district,

            unique_districts,

            n=5,

            cutoff=0.65

        )


        print(
            "⚠️ Exact match not found."
        )


        print(
            "Possible matches:",
            possible_matches
        )


        if len(possible_matches) > 0:

            best_match = (
                possible_matches[0]
            )


            print(
                "Best possible match:",
                best_match
            )


            # IMPORTANT:
            # We do NOT automatically merge fuzzy match.
            # User must verify geography.

            print(
                "⚠️ Fuzzy match found, "
                "but automatic merge skipped "
                "for data accuracy."
            )


        continue


    # =====================================================
    # MATCH FOUND
    # =====================================================

    print(
        f"✅ MATCH FOUND: {survey_district}"
    )


    print(
        "Matching rows:",
        len(matched)
    )


    # =====================================================
    # REMOVE DISTRICT DUPLICATE COLUMN
    # =====================================================

    columns_to_drop = [

        "_district_key",

        district_column,

    ]


    matched = matched.drop(

        columns=[
            col
            for col in columns_to_drop
            if col in matched.columns
        ],

        errors="ignore"

    )


    # =====================================================
    # ADD PREFIX
    # =====================================================

    prefix = (
        os.path.splitext(
            filename
        )[0]
    )


    renamed_columns = {}


    for col in matched.columns:

        if col in merged.columns:

            renamed_columns[col] = (
                f"{prefix}_{col}"
            )


    matched = matched.rename(
        columns=renamed_columns
    )


    # =====================================================
    # MERGE
    # =====================================================

    merged = pd.concat(

        [
            merged.reset_index(
                drop=True
            ),

            matched.reset_index(
                drop=True
            )

        ],

        axis=1

    )


    matched_datasets.append(
        filename
    )


# =========================================================
# REMOVE INTERNAL COLUMN
# =========================================================

merged = merged.drop(

    columns=[
        "_district_key"
    ],

    errors="ignore"

)


# =========================================================
# SAVE FINAL DATASET
# =========================================================

OUTPUT_FILE = os.path.join(

    PROCESSED_DIR,

    "combined_school_dataset.csv"

)


merged.to_csv(

    OUTPUT_FILE,

    index=False,

    encoding="utf-8-sig"

)


# =========================================================
# FINAL REPORT
# =========================================================

print("\n")
print("=" * 80)
print("MERGE COMPLETED")
print("=" * 80)


print(
    "Matched datasets:"
)


if len(matched_datasets) == 0:

    print(
        "❌ NONE"
    )

else:

    for dataset in matched_datasets:

        print(
            "✓",
            dataset
        )


print(
    "\nFinal rows:",
    len(merged)
)


print(
    "Final columns:",
    len(merged.columns)
)


print(
    "\nFinal dataset saved:"
)


print(
    OUTPUT_FILE
)


print("\n")
print(
    "FINAL COLUMNS:"
)


for col in merged.columns:

    print(
        "-",
        col
    )


print("\n")
print("=" * 80)
print("NEXT STEP")
print("=" * 80)


if len(matched_datasets) == 0:

    print(
        "❌ No UDISE dataset matched the survey district."
    )

    print(
        "Do NOT train the model yet."
    )

    print(
        "Download the correct Chhattisgarh/Durg "
        "district-level UDISE dataset."
    )

else:

    print(
        "✅ Dataset ready for feature engineering."
    )

    print(
        "Next: python trainmodel.py"
    )