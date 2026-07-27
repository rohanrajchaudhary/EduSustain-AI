import os
import pandas as pd
import numpy as np


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

INPUT_FILE = os.path.join(
    BASE_DIR,
    "processed",
    "combined_school_dataset.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "processed",
    "ml_features.csv"
)


# ============================================================
# LOAD
# ============================================================

print(
    "\nLoading combined dataset..."
)


df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)


print(
    "Rows:",
    len(df)
)

print(
    "Columns:",
    len(df.columns)
)


# ============================================================
# HELPER
# ============================================================

def find_column(
    keywords
):

    for col in df.columns:

        col_lower = str(
            col
        ).lower()

        for keyword in keywords:

            if keyword in col_lower:

                return col

    return None


# ============================================================
# FIND IMPORTANT COLUMNS
# ============================================================

total_schools = find_column([
    "total schools"
])

playground = find_column([
    "playground"
])

drinking_water = find_column([
    "drinking water"
])

functional_water = find_column([
    "functional drinking water"
])

electricity = find_column([
    "electricity"
])

functional_electricity = find_column([
    "functional electricity"
])

internet = find_column([
    "internet facility"
])

computer = find_column([
    "computer facility"
])

solar = find_column([
    "solar panel"
])

green_area = find_column([
    "green_area",
    "green area"
])

students = find_column([
    "students",
    "total_students",
    "enrolment"
])


print("\nDetected columns:")

print(
    "Total Schools:",
    total_schools
)

print(
    "Playground:",
    playground
)

print(
    "Drinking Water:",
    drinking_water
)

print(
    "Functional Water:",
    functional_water
)

print(
    "Electricity:",
    electricity
)

print(
    "Functional Electricity:",
    functional_electricity
)

print(
    "Internet:",
    internet
)

print(
    "Computer:",
    computer
)

print(
    "Solar:",
    solar
)

print(
    "Green Area:",
    green_area
)

print(
    "Students:",
    students
)


# ============================================================
# NUMERIC CLEANING
# ============================================================

for col in df.columns:

    if col in [
        "India/State/UT",
        "district",
        "District"
    ]:

        continue


    df[col] = pd.to_numeric(

        df[col],

        errors="coerce"

    )


# ============================================================
# SAFE DIVISION
# ============================================================

def safe_percentage(
    numerator,
    denominator
):

    denominator = denominator.replace(
        0,
        np.nan
    )

    return (
        numerator
        /
        denominator
        *
        100
    )


# ============================================================
# CREATE FEATURES
# ============================================================

if (
    total_schools
    and playground
):

    df[
        "playground_percentage"
    ] = safe_percentage(

        df[playground],

        df[total_schools]

    )


if (
    total_schools
    and functional_water
):

    df[
        "functional_water_percentage"
    ] = safe_percentage(

        df[functional_water],

        df[total_schools]

    )


if (
    total_schools
    and functional_electricity
):

    df[
        "functional_electricity_percentage"
    ] = safe_percentage(

        df[functional_electricity],

        df[total_schools]

    )


if (
    total_schools
    and internet
):

    df[
        "internet_percentage"
    ] = safe_percentage(

        df[internet],

        df[total_schools]

    )


if (
    total_schools
    and computer
):

    df[
        "computer_percentage"
    ] = safe_percentage(

        df[computer],

        df[total_schools]

    )


if (
    total_schools
    and solar
):

    df[
        "solar_percentage"
    ] = safe_percentage(

        df[solar],

        df[total_schools]

    )


# ============================================================
# CLIP PERCENTAGES
# ============================================================

percentage_columns = [

    col

    for col in df.columns

    if "percentage" in col

]


for col in percentage_columns:

    df[col] = df[col].clip(
        0,
        100
    )


# ============================================================
# SAVE
# ============================================================

df.to_csv(

    OUTPUT_FILE,

    index=False

)


print("\n")
print("=" * 80)
print("FEATURE ENGINEERING COMPLETED ✅")
print("=" * 80)


print(
    "\nSaved:"
)

print(
    OUTPUT_FILE
)


print(
    "\nRows:",
    len(df)
)

print(
    "Columns:",
    len(df.columns)
)