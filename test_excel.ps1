$file = "D:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\TEST\RIVANA\3. ChungCu_RIVANA_Bieu do phu tai_Them thoi gian lam viec.xlsx"
$objExcel = New-Object -ComObject Excel.Application
$objExcel.Visible = $false
$wb = $objExcel.Workbooks.Open($file)
$ws = $wb.Sheets.Item(1)

# Read first 15 rows, 5 cols
for ($r = 1; $r -le 15; $r++) {
    $line = ""
    for ($c = 1; $c -le 5; $c++) {
        $val = $ws.Cells.Item($r, $c).Text
        $line += $val + ","
    }
    Write-Output $line
}

$wb.Close($false)
$objExcel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($objExcel) | Out-Null
