

$dir = "..\1. Database"
$dirPath = Resolve-Path $dir
$fileObj = Get-ChildItem -Path $dirPath -Filter "*1_519.xlsx" | Select-Object -First 1
if ($null -eq $fileObj) {
    Write-Error "File not found!"
    exit 1
}
$file = $fileObj.FullName
Write-Output "Processing file: $file"

$objExcel = New-Object -ComObject Excel.Application
$objExcel.Visible = $false
try {
    $wb = $objExcel.Workbooks.Open($file)
    $ws = $wb.Sheets.Item(1)
    Write-Output "--- SHEET: $($ws.Name) ---"
    
    # Read first 10 rows to identify structure
    for ($r = 1; $r -le 10; $r++) {
        $rowText = ""
        for ($c = 1; $c -le 10; $c++) {
            $val = $ws.Cells.Item($r, $c).Text
            $rowText += "[$val] "
        }
        Write-Output "Row $r : $rowText"
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
