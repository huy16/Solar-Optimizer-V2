import pandas as pd

file_path = r"d:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\Tool V2\SOLAR CALCULATION TOOL_V2.xlsm"

try:
    xl = pd.ExcelFile(file_path)
    print("Sheet Names:", xl.sheet_names)
except Exception as e:
    print("Error reading excel:", e)
