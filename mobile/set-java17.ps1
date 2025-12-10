# PowerShell script to set JAVA_HOME to Java 17 for React Native build

Write-Host "Searching for Java 17..." -ForegroundColor Yellow

# Check common Java 17 locations
$java17Paths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk-21*",
    "$env:LOCALAPPDATA\Android\Sdk\jbr",
    "C:\Program Files\Android\Android Studio\jbr"
)

$foundJava = $null

foreach ($path in $java17Paths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $javaExe = Join-Path $resolved[0] "bin\java.exe"
        if (Test-Path $javaExe) {
            $version = & $javaExe -version 2>&1 | Select-String "version"
            if ($version -match 'version "1[7-9]' -or $version -match 'version "2[01]') {
                $foundJava = $resolved[0]
                Write-Host "Found Java at: $foundJava" -ForegroundColor Green
                Write-Host "Version: $version" -ForegroundColor Green
                break
            }
        }
    }
}

if ($foundJava) {
    # Set JAVA_HOME for current session
    $env:JAVA_HOME = $foundJava
    # Update PATH to prioritize Java 17
    $java17Bin = Join-Path $foundJava "bin"
    $env:PATH = "$java17Bin;$env:PATH"
    
    # Also update system environment variable for this session
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $foundJava, "Process")
    
    Write-Host "`nJAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
    Write-Host "PATH updated to use Java 17" -ForegroundColor Green
    
    # Verify
    $javaVersion = & "$java17Bin\java.exe" -version 2>&1 | Select-String "version"
    Write-Host "Java version: $javaVersion" -ForegroundColor Cyan
    Write-Host "`nYou can now run: npm run android" -ForegroundColor Cyan
} else {
    Write-Host "`nJava 17/21 not found!" -ForegroundColor Red
    Write-Host "Please install Java 17 from: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
    Write-Host "Or see INSTALL_JAVA.md for detailed instructions." -ForegroundColor Yellow
}

