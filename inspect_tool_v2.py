import pandas as pd
import os

file_path = r"D:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\Tool V2\SOLAR CALCULATION TOOL_V2.xlsm"

print(f"Analyzing: {file_path}")

try:
    # Load the Excel file to get sheet names
    xl = pd.ExcelFile(file_path)
    sheet_names = xl.sheet_names
    print(f"Found {len(sheet_names)} sheets: {sheet_names}")

    # Analyze each sheet simply
    for sheet in sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        try:
            # Read first few rows without header initially to see layout
            df = pd.read_excel(file_path, sheet_name=sheet, nrows=10, header=None)
            print(df.to_string())
        except Exception as e:
            print(f"Error reading sheet {sheet}: {e}")

except Exception as e:
    print(f"Error opening file: {e}")
