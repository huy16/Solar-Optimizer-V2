$folderPath = "..\TEST\RIVANA"
$file = Get-ChildItem -Path $folderPath | Where-Object { $_.Name -like "*3. ChungCu_RIVANA_Bieu do phu tai*" } | Select-Object -First 1
if (-not $file) { Write-Error "File not found"; exit }
$fullPath = $file.FullName

$objExcel = New-Object -ComObject Excel.Application
$objExcel.Visible = $false
try {
    $wb = $objExcel.Workbooks.Open($fullPath)
    $ws = $wb.Sheets.Item(1)
    
    # Read first 20 rows, Cols 10 (J) to 35 (AI)
    # J is 10. AH is 34.
    for ($r = 1; $r -le 20; $r++) {
        $line = "Row " + $r + ": "
        for ($c = 10; $c -le 35; $c++) {
            $val = $ws.Cells.Item($r, $c).Text
            if ($val) { $line += "[" + $val + "] " }
        }
        if ($line.Length -gt 10) { Write-Output $line }
    }
    
    $wb.Close($false)
}
catch {
    Write-Error $_
}
$objExcel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($objExcel) | Out-Null
