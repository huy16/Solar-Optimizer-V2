
import pandas as pd
import sys

file_path = r"D:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\1. Database\Biểu-đồ-phụ-tải may so 1_519.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Reading Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print(df.head())
        print(df.columns)
except Exception as e:
    print(f"Error: {e}")
