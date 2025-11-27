# Quick PATH refresh script for k6
# Run this in PowerShell if k6 is not recognized: .\refresh-path.ps1

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "PATH refreshed!" -ForegroundColor Green
Write-Host "Testing k6..." -ForegroundColor Yellow

if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "[OK] k6 is now available!" -ForegroundColor Green
    k6 version
} else {
    Write-Host "[ERROR] k6 still not found. Try restarting your terminal." -ForegroundColor Red
}

