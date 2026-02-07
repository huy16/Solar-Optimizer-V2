
import pandas as pd
import os

file_path = r"D:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\1. Database\2. Load Data Analysis\SUB_519_Bieu do phu tai_Them thoi gian lam viec.xlsx"

try:
    print(f"Reading file: {file_path}")
    # Read the first few rows to inspect structure
    df = pd.read_excel(file_path, header=None)
    
    print("\n--- First 20 rows of Raw Data ---")
    print(df.head(20))
    
    print("\n--- Basic Statistics of Numeric Columns ---")
    # Try to convert to numeric to see range
    df_numeric = df.apply(pd.to_numeric, errors='coerce')
    print(df_numeric.describe())
    
except Exception as e:
    print(f"Error reading file: {e}")
