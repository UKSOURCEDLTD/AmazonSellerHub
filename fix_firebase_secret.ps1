$ErrorActionPreference = "Stop"

Write-Host "Firebase Service Account JSON Fixer" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host "`nThis script will help you properly set the FIREBASE_SERVICE_ACCOUNT secret."
Write-Host "`nOption 1: Load from file (recommended)"
Write-Host "Option 2: Paste JSON manually"

$choice = Read-Host "`nEnter choice (1 or 2)"

if ($choice -eq "1") {
    $filePath = Read-Host "Enter the full path to your service account JSON file (e.g., C:\path\to\sa-key.json)"
    
    if (Test-Path $filePath) {
        $jsonContent = Get-Content $filePath -Raw
        Write-Host "`nUploading service account JSON to GitHub..." -ForegroundColor Yellow
        $jsonContent | gh secret set FIREBASE_SERVICE_ACCOUNT
        Write-Host "Success! FIREBASE_SERVICE_ACCOUNT updated." -ForegroundColor Green
    }
    else {
        Write-Host "File not found: $filePath" -ForegroundColor Red
        exit 1
    }
}
elseif ($choice -eq "2") {
    Write-Host "`nPaste the ENTIRE JSON content below (press Enter on empty line when done):"
    Write-Host "It should start with { and end with }" -ForegroundColor Yellow
    
    $lines = @()
    do {
        $line = Read-Host
        if ($line) { $lines += $line }
    } while ($line)
    
    $jsonContent = $lines -join "`n"
    
    # Validate it's JSON
    try {
        $null = $jsonContent | ConvertFrom-Json
        Write-Host "`nJSON is valid! Uploading to GitHub..." -ForegroundColor Yellow
        $jsonContent | gh secret set FIREBASE_SERVICE_ACCOUNT
        Write-Host "Success! FIREBASE_SERVICE_ACCOUNT updated." -ForegroundColor Green
    }
    catch {
        Write-Host "`nERROR: Invalid JSON format!" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}
else {
    Write-Host "Invalid choice!" -ForegroundColor Red
    exit 1
}

Write-Host "`nDone! You can now push to trigger deployment." -ForegroundColor Green
