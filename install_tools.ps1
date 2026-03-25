Write-Host "=============================================" -ForegroundColor Green
Write-Host "Phoenix CyberSec Native Tool Installer" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script attempts to install core dependencies (Nmap, Go, Nuclei) on your Windows machine." -ForegroundColor Yellow

# Ensure Winget is functional
winget --version

Write-Host "1. Installing Nmap..." -ForegroundColor Cyan
winget install -e --id Insecure.Nmap -h --accept-package-agreements --accept-source-agreements

Write-Host "2. Installing GoLang (Required for Nuclei, Subfinder)..." -ForegroundColor Cyan
winget install -e --id GoLang.Go -h --accept-package-agreements --accept-source-agreements

Write-Host "Refreshing Environment PATH..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "3. Installing Nuclei via Go..." -ForegroundColor Cyan
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

Write-Host "4. Installing Subfinder via Go..." -ForegroundColor Cyan
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

Write-Host "5. Installing FFUF via Go..." -ForegroundColor Cyan
go install -v github.com/ffuf/ffuf/v2@latest

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Installation Core Tools Complete!" -ForegroundColor Green
Write-Host "CRITICAL: You MUST restart your Command Prompt or VS Code for the PATH variables to apply." -ForegroundColor Red
Write-Host "After restarting, tests running 'nmap' and 'nuclei' in your terminal." -ForegroundColor Yellow

pause
