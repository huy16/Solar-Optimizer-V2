$folderPath = "..\TEST\RIVANA"
$file = Get-ChildItem -Path $folderPath | Where-Object { $_.Name -like "*3. ChungCu_RIVANA_Bieu do phu tai*" } | Select-Object -First 1
if (-not $file) { Write-Error "File not found"; exit }
$fullPath = $file.FullName

$objExcel = New-Object -ComObject Excel.Application
$objExcel.Visible = $false
try {
    $wb = $objExcel.Workbooks.Open($fullPath)
    $ws = $wb.Sheets.Item(1)
    
    Write-Output "--- Monthly Table (First 20 rows, First 8 cols) ---"
    for ($r = 1; $r -le 20; $r++) {
        $line = "R$r : "
        for ($c = 1; $c -le 8; $c++) {
            $val = $ws.Cells.Item($r, $c).Text
            $line += "[$val] "
        }
        Write-Output $line
    }
    
    $wb.Close($false)
}
catch {
    Write-Error $_
}
$objExcel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($objExcel) | Out-Null
