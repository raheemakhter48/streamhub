# ngrok Installation Script
Write-Host "`nDownloading ngrok..." -ForegroundColor Cyan

$ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$tempZip = "$env:TEMP\ngrok.zip"
$extractPath = "$env:TEMP\ngrok"
$installPath = "C:\ngrok"

try {
    # Download
    Write-Host "Downloading ngrok..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $ngrokUrl -OutFile $tempZip -UseBasicParsing
    
    Write-Host "Download complete!" -ForegroundColor Green
    
    # Extract
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    Expand-Archive -Path $tempZip -DestinationPath $extractPath -Force
    
    # Install
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    Copy-Item "$extractPath\ngrok.exe" -Destination "$installPath\ngrok.exe" -Force -ErrorAction Stop
    
    Write-Host "`nngrok installed successfully!" -ForegroundColor Green
    Write-Host "Location: $installPath\ngrok.exe" -ForegroundColor Cyan
    
    Write-Host "`nAb ngrok use kar sakte hain:" -ForegroundColor Yellow
    Write-Host "   $installPath\ngrok.exe http 3000" -ForegroundColor Cyan
    
    Write-Host "`nPATH add karna chahte hain? (Optional)" -ForegroundColor Yellow
    $addToPath = Read-Host "Add to PATH? (y/n)"
    
    if ($addToPath -eq 'y' -or $addToPath -eq 'Y') {
        $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($currentPath -notlike "*$installPath*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", [EnvironmentVariableTarget]::User)
            Write-Host "Added to PATH! Ab 'ngrok' command directly use kar sakte hain." -ForegroundColor Green
            Write-Host "   (New terminal open karein ya restart karein)" -ForegroundColor Yellow
        } else {
            Write-Host "Already in PATH!" -ForegroundColor Green
        }
    }
    
    # Cleanup
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    Write-Host "`nManual download: https://ngrok.com/download" -ForegroundColor Yellow
}
