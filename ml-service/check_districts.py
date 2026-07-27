import pandas as pd
import os

DATA_DIR = "data"

files = [
    "infrastructure_highlights.csv",
    "drinking_water.csv",
    "enrolment.csv",
    "infrastructure.csv",
]

for filename in files:

    path = os.path.join(DATA_DIR, filename)

    print("\n" + "=" * 80)
    print("FILE:", filename)
    print("=" * 80)

    if not os.path.exists(path):
        print("❌ FILE NOT FOUND")
        continue

    try:
        df = pd.read_csv(
            path,
            encoding="utf-8-sig",
            low_memory=False
        )

    except Exception as e:
        print("Normal CSV failed:", e)

        try:
            df = pd.read_csv(
                path,
                encoding="latin1",
                low_memory=False
            )
        except Exception as e2:
            print("❌ Could not read:", e2)
            continue

    print("Rows:", len(df))
    print("Columns:", len(df.columns))

    print("\nCOLUMN NAMES:")
    for col in df.columns:
        print("-", col)

    # Find district-like columns
    district_columns = [
        col for col in df.columns
        if "district" in str(col).lower()
    ]

    print("\nDISTRICT-LIKE COLUMNS:")
    print(district_columns)

    for col in district_columns:

        print("\nDISTRICT COLUMN:", col)

        values = (
            df[col]
            .dropna()
            .astype(str)
            .str.strip()
            .str.upper()
            .unique()
        )

        print("Number of unique districts:", len(values))

        print("First 100 values:")
        print(values[:100])

        # Check Durg
        durg_matches = [
            value
            for value in values
            if "DURG" in value
        ]

        print("\nDURG MATCHES:")
        print(durg_matches)

print("\n")
print("=" * 80)
print("CHECK COMPLETED")
print("=" * 80)