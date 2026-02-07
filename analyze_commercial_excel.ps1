$file = "D:\TOOL GOOGLE ANTIGRAVITY\2. Tool Tính toán công suất\1. Database\C&I_Result_Send Commercial.xlsx"
$objExcel = New-Object -ComObject Excel.Application
$objExcel.Visible = $false
try {
    $wb = $objExcel.Workbooks.Open($file)

    # List Sheets
    Write-Output "SHEETS:"
    foreach ($s in $wb.Sheets) {
        Write-Output $s.Name
    }

    # Dump likely summary sheet (usually first or named Input/Summary)
    $ws = $wb.Sheets.Item(1)
    Write-Output "--- CONTENT OF SHEET 1 ($($ws.Name)) ---"
    for ($r = 1; $r -le 120; $r++) {
        $rowText = ""
        $hasData = $false
        for ($c = 1; $c -le 12; $c++) {
            # Check first 12 columns
            $val = $ws.Cells.Item($r, $c).Text
            if ($val -ne "") { $hasData = $true }
            $rowText += "[$val] "
        }
        if ($hasData) { Write-Output "Row $r : $rowText" }
    }
    
    # Check 2nd sheet just in case
    if ($wb.Sheets.Count -ge 2) {
        $ws2 = $wb.Sheets.Item(2)
        Write-Output "--- CONTENT OF SHEET 2 ($($ws2.Name)) ---"
        for ($r = 1; $r -le 20; $r++) {
            $rowText = ""
            $hasData = $false
            for ($c = 1; $c -le 10; $c++) {
                $val = $ws2.Cells.Item($r, $c).Text
                if ($val -ne "") { $hasData = $true }
                $rowText += "[$val] "
            }
            if ($hasData) { Write-Output "Row $r : $rowText" }
        }
    }

}
catch {
    Write-Error $_
}
finally {
    if ($wb) { $wb.Close($false) }
    $objExcel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($objExcel) | Out-Null
}
