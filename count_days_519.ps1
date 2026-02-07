
$dir = "..\1. Database"
try {
    $dirPath = Resolve-Path $dir
    $fileObj = Get-ChildItem -Path $dirPath -Filter "*1_519.xlsx" | Select-Object -First 1
    if ($null -eq $fileObj) {
        Write-Error "File not found!"
        exit 1
    }
    $file = $fileObj.FullName
    Write-Output "Analyzing file: $file"

    $objExcel = New-Object -ComObject Excel.Application
    $objExcel.Visible = $false
    
    $wb = $objExcel.Workbooks.Open($file)
    $ws = $wb.Sheets.Item(1)
    

    $dates = New-Object System.Collections.Generic.HashSet[String]
    
    # Fast method: Read the whole UsedRange of Column A
    $usedRange = $ws.UsedRange
    $rowCount = $usedRange.Rows.Count
    Write-Output "Total used rows in sheet: $rowCount"
    
    if ($rowCount -gt 1) {
        # Read Column A from row 2 to end
        $range = $ws.Range("A2:A$rowCount")
        $values = $range.Value2
        
        # $values is a 2D array (1-based in COM, but PS handles it as array)
        # If it's a single cell, it's not an array.
        
        foreach ($item in $values) {
            if (-not [string]::IsNullOrWhiteSpace($item)) {
                # Excel Value2 (double) for dates usually, or string if formatted
                # But Value2 often returns double for dates (OADate).
                # If it's OADate (number), convert. If string, parse.
                
                $dateStr = ""
                if ($item -is [double] -or $item -is [int] -or $item -is [long]) {
                    try {
                        $dateStr = [DateTime]::FromOADate($item).ToString("yyyy-MM-dd")
                    }
                    catch {}
                }
                elseif ($item -is [string]) {
                    $dateStr = $item -split "T" | Select-Object -First 1
                    $dateStr = $dateStr -split " " | Select-Object -First 1
                }
                
                if (-not [string]::IsNullOrWhiteSpace($dateStr)) {
                    $dates.Add($dateStr) | Out-Null
                }
            }
        }
    }
    
    Write-Output "Unique Days Count: $($dates.Count)"
    
    # Sort and print first/last
    $sortedDates = $dates | Sort-Object
    if ($sortedDates.Count -gt 0) {
        Write-Output "First Date: $($sortedDates[0])"
        Write-Output "Last Date: $($sortedDates[-1])"
    }

    
}
catch {
    Write-Error $_
}
finally {
    if ($wb) { $wb.Close($false) }
    if ($objExcel) {
        $objExcel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($objExcel) | Out-Null
    }
}
