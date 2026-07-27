import os
import glob
import pandas as pd
import re


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "processed"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# POSSIBLE KEY NAMES
# ============================================================

KEY_ALIASES = {

    "udise_code": [
        "udise code",
        "udise_code",
        "udise",
        "udise school code",
        "school udise code"
    ],

    "state": [
        "state",
        "state name",
        "state/ut",
        "india/state/ut",
        "india state ut"
    ],

    "district": [
        "district",
        "district name"
    ],

    "block": [
        "block",
        "block name"
    ],

    "school_name": [
        "school name",
        "school_name",
        "name of school",
        "school"
    ]
}


# ============================================================
# NORMALIZE COLUMN
# ============================================================

def normalize_column(column):

    column = str(column)

    column = (
        column
        .strip()
        .lower()
        .replace("\n", " ")
        .replace("_", " ")
        .replace("-", " ")
    )

    column = re.sub(
        r"\s+",
        " ",
        column
    )

    return column.strip()


# ============================================================
# DETECT KEY
# ============================================================

def detect_keys(columns):

    normalized = {
        normalize_column(col): col
        for col in columns
    }

    detected = {}

    for key, aliases in KEY_ALIASES.items():

        for alias in aliases:

            alias_normalized = normalize_column(
                alias
            )

            if alias_normalized in normalized:

                detected[key] = normalized[
                    alias_normalized
                ]

                break

    return detected


# ============================================================
# FIND CSV FILES
# ============================================================

def find_files():

    patterns = [
        "*.csv",
        "*.CSV"
    ]

    files = []

    for pattern in patterns:

        files.extend(
            glob.glob(
                os.path.join(
                    DATA_DIR,
                    pattern
                )
            )
        )

    return sorted(
        list(
            set(files)
        )
    )


# ============================================================
# LOAD CSV
# ============================================================

def load_csv(filepath):

    print(
        "\nLoading:",
        os.path.basename(filepath)
    )

    try:

        df = pd.read_csv(
            filepath,
            low_memory=False
        )

    except UnicodeDecodeError:

        df = pd.read_csv(
            filepath,
            encoding="latin1",
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

    return df


# ============================================================
# INSPECT ALL FILES
# ============================================================

def inspect_datasets(files):

    datasets = {}

    print(
        "\n"
        + "=" * 80
    )

    print(
        "DATASET INSPECTION"
    )

    print(
        "=" * 80
    )

    for filepath in files:

        try:

            df = load_csv(
                filepath
            )

            name = os.path.basename(
                filepath
            )

            detected = detect_keys(
                df.columns
            )

            datasets[name] = {
                "path": filepath,
                "df": df,
                "keys": detected
            }

            print(
                "\nFILE:",
                name
            )

            print(
                "Detected keys:"
            )

            if detected:

                for key, column in detected.items():

                    print(
                        f"  ✓ {key} -> {column}"
                    )

            else:

                print(
                    "  No common keys detected"
                )

        except Exception as error:

            print(
                "ERROR:",
                error
            )


    return datasets


# ============================================================
# FIND COMMON KEYS
# ============================================================

def find_common_keys(datasets):

    print(
        "\n"
        + "=" * 80
    )

    print(
        "COMMON KEY ANALYSIS"
    )

    print(
        "=" * 80
    )


    key_files = {}


    for filename, info in datasets.items():

        for key in info["keys"]:

            if key not in key_files:

                key_files[key] = []

            key_files[key].append(
                filename
            )


    for key, files in key_files.items():

        print(
            f"\n{key}:"
        )

        for filename in files:

            print(
                "  -",
                filename
            )


    print(
        "\n"
        + "=" * 80
    )

    print(
        "BEST POSSIBLE MERGE KEY"
    )

    print(
        "=" * 80
    )


    priority = [
        "udise_code",
        "district",
        "block",
        "state",
        "school_name"
    ]


    for key in priority:

        if (
            key in key_files
            and len(
                key_files[key]
            ) >= 2
        ):

            print(
                "✓",
                key,
                "can potentially merge",
                len(
                    key_files[key]
                ),
                "datasets."
            )

            return key


    print(
        "❌ No common merge key found."
    )

    return None


# ============================================================
# SAVE SURVEY DATA
# ============================================================

def save_survey_dataset(
    datasets
):

    survey_info = None


    for filename, info in datasets.items():

        lower_name = filename.lower()

        if (
            "survey" in lower_name
            or "survey_data" in lower_name
        ):

            survey_info = info

            break


    if survey_info is None:

        print(
            "\nNo survey CSV automatically detected."
        )

        return


    survey_df = survey_info["df"].copy()


    output_path = os.path.join(
        OUTPUT_DIR,
        "survey_data_clean.csv"
    )


    survey_df.to_csv(
        output_path,
        index=False
    )


    print(
        "\n✓ Survey data saved:"
    )

    print(
        output_path
    )

    print(
        "Survey rows:",
        len(survey_df)
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "\n"
        + "=" * 80
    )

    print(
        "EDUSUSTAIN AI - REAL DATA PIPELINE"
    )

    print(
        "=" * 80
    )


    if not os.path.exists(
        DATA_DIR
    ):

        print(
            "\n❌ Data folder not found:"
        )

        print(
            DATA_DIR
        )

        return


    files = find_files()


    if not files:

        print(
            "\n❌ No CSV files found."
        )

        return


    print(
        "\nFound",
        len(files),
        "CSV files:"
    )


    for file in files:

        print(
            "  ✓",
            os.path.basename(file)
        )


    # ========================================================
    # INSPECT
    # ========================================================

    datasets = inspect_datasets(
        files
    )


    # ========================================================
    # COMMON KEY
    # ========================================================

    best_key = find_common_keys(
        datasets
    )


    # ========================================================
    # SAVE SURVEY
    # ========================================================

    save_survey_dataset(
        datasets
    )


    # ========================================================
    # FINAL MESSAGE
    # ========================================================

    print(
        "\n"
        + "=" * 80
    )

    print(
        "INSPECTION COMPLETED ✅"
    )

    print(
        "=" * 80
    )


    if best_key:

        print(
            "\nPotential merge key:",
            best_key
        )

        print(
            "\nNext step: We will create the final merged dataset."
        )

    else:

        print(
            "\nNo safe common key found."
        )

        print(
            "Survey data will remain as separate school-level ground truth."
        )


if __name__ == "__main__":

    main()