import pandas as pd
import os
import glob


DATA_FOLDER = "data"
OUTPUT_FOLDER = "data/fixed"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)


csv_files = glob.glob(
    os.path.join(DATA_FOLDER, "*.csv")
)


print("\n======================================")
print("CSV REPAIR TOOL")
print("======================================\n")


for file_path in csv_files:

    file_name = os.path.basename(file_path)

    print("\n--------------------------------------")
    print("Processing:", file_name)
    print("--------------------------------------")

    try:

        # First try normal read
        df = pd.read_csv(
            file_path,
            encoding="utf-8-sig"
        )

        print(
            "✓ Normal CSV loaded successfully"
        )

    except Exception as error:

        print(
            "⚠ Normal read failed:"
        )

        print(error)

        print(
            "\nTrying Python engine..."
        )

        try:

            df = pd.read_csv(
                file_path,
                encoding="utf-8-sig",
                engine="python",
                on_bad_lines="warn"
            )

            print(
                "✓ CSV loaded with tolerant parser"
            )

        except Exception as error2:

            print(
                "❌ Could not repair:",
                error2
            )

            continue


    # Clean column names

    df.columns = (

        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(
            " ",
            "_"
        )
        .str.replace(
            "/",
            "_",
            regex=False
        )

    )


    # Remove completely empty rows

    df = df.dropna(
        how="all"
    )


    # Save fixed file

    output_path = os.path.join(
        OUTPUT_FOLDER,
        file_name
    )


    df.to_csv(
        output_path,
        index=False
    )


    print(
        "✓ Fixed file saved:"
    )

    print(
        output_path
    )

    print(
        "Rows:",
        len(df)
    )

    print(
        "Columns:",
        len(df.columns)
    )


print("\n======================================")
print("CSV REPAIR COMPLETED ✅")
print("======================================")