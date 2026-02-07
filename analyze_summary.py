import pandas as pd
import os

file_path = r"D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"File: {os.path.basename(file_path)}")
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=10)
        print(df.to_string())
        print("-" * 50)
        
except Exception as e:
    print(f"Error reading file: {e}")
