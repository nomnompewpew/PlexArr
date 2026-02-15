# PlexArr Installation Script for Windows
# 
# Usage: Run PowerShell as Administrator, then:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   .\install.ps1
#
# This script will:
#   1. Detect Windows version and architecture
#   2. Install Node.js, Docker Desktop, Git
#   3. Clone/setup PlexArr repository
#   4. Start the application

param(
    [switch]$SkipElevation = $false
)

# Requires admin privileges
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "1. Right-click PowerShell and select 'Run as administrator'"
    Write-Host "2. Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
    Write-Host "3. Run: .\install.ps1"
    exit 1
}

################################################################################
# UTILITY FUNCTIONS
################################################################################

function Write-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠ $Text" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ $Text" -ForegroundColor Cyan
}

function Read-Confirmation {
    param([string]$Prompt)
    $response = Read-Host "$Prompt (y/n)"
    return $response -eq 'y' -or $response -eq 'Y'
}

################################################################################
# SYSTEM DETECTION
################################################################################

function Get-WindowsInfo {
    Write-Info "Detecting Windows version..."
    
    $os = Get-CimInstance Win32_OperatingSystem
    $version = $os.Version
    $arch = If ([System.Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    
    Write-Info "Windows: $($os.Caption)"
    Write-Info "Version: $version"
    Write-Info "Architecture: $arch"
    
    # Check minimum Windows version (Windows 10 or later)
    $majorVersion = [int]$version.Split('.')[0]
    if ($majorVersion -lt 10) {
        Write-Error-Custom "Windows 10 or later is required"
        exit 1
    }
    
    return @{
        Version = $version
        Architecture = $arch
    }
}

################################################################################
# DEPENDENCY CHECKING
################################################################################

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Get-InstalledVersion {
    param([string]$Command)
    try {
        $output = & $Command --version 2>&1
        return $output[0]
    } catch {
        return $null
    }
}

function Check-Dependencies {
    Write-Info "Checking installed dependencies..."
    Write-Host ""
    
    $missing = @()
    
    # Check Node.js
    if (Test-CommandExists node) {
        Write-Success "Node.js: $(Get-InstalledVersion node)"
    } else {
        Write-Warning "Node.js not found"
        $missing += "node"
    }
    
    # Check npm
    if (Test-CommandExists npm) {
        Write-Success "npm: $(Get-InstalledVersion npm)"
    } else {
        Write-Warning "npm not found"
        $missing += "npm"
    }
    
    # Check Docker
    if (Test-CommandExists docker) {
        Write-Success "Docker: Installed"
    } else {
        Write-Warning "Docker not found"
        $missing += "docker"
    }
    
    # Check Git
    if (Test-CommandExists git) {
        Write-Success "Git: $(Get-InstalledVersion git)"
    } else {
        Write-Warning "Git not found"
        $missing += "git"
    }
    
    if ($missing.Count -eq 0) {
        Write-Success "All dependencies installed!"
        return $true
    } else {
        Write-Warning "Missing: $($missing -join ', ')"
        return $false
    }
}

################################################################################
# INSTALLATION FUNCTIONS
################################################################################

function Install-Chocolatey {
    Write-Info "Installing Chocolatey package manager..."
    
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    
    Write-Info "Downloading Chocolatey..."
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    Write-Success "Chocolatey installed"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-NodeJS {
    param([string]$MissingPackage)
    
    if ($MissingPackage -ne "node") {
        return
    }
    
    Write-Info "Installing Node.js..."
    
    # Use Chocolatey if available
    if (Test-CommandExists choco) {
        choco install nodejs -y
    } else {
        # Fall back to direct download from nodejs.org
        Write-Info "Downloading Node.js from nodejs.org..."
        $nodeVersion = "18.19.0"
        $downloadUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
        $installerPath = "$env:TEMP\nodejs-installer.msi"
        
        (New-Object System.Net.WebClient).DownloadFile($downloadUrl, $installerPath)
        
        Write-Info "Running Node.js installer..."
        Start-Process -FilePath msiexec.exe -ArgumentList "/i $installerPath /quiet" -Wait
        
        Remove-Item $installerPath
    }
    
    Write-Success "Node.js installed"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-Docker {
    param([string]$MissingPackage)
    
    if ($MissingPackage -ne "docker") {
        return
    }
    
    Write-Info "Installing Docker Desktop..."
    Write-Warning "This will install Docker Desktop. You may need to restart your computer after installation."
    
    if (-not (Read-Confirmation "Continue with Docker Desktop installation?")) {
        Write-Error-Custom "Docker Desktop installation skipped"
        Write-Info "Please install Docker Desktop manually from: https://www.docker.com/products/docker-desktop"
        return
    }
    
    # Use Chocolatey if available
    if (Test-CommandExists choco) {
        choco install docker-desktop -y
    } else {
        # Download and run Docker Desktop installer
        Write-Info "Downloading Docker Desktop..."
        $downloadUrl = "https://desktop.docker.com/win/stable/x86_64/Docker%20Desktop%20Installer.exe"
        $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
        
        (New-Object System.Net.WebClient).DownloadFile($downloadUrl, $installerPath)
        
        Write-Info "Running Docker Desktop installer..."
        Start-Process -FilePath $installerPath -ArgumentList "install --quiet --accept-license" -Wait
        
        Remove-Item $installerPath
    }
    
    Write-Warning "Docker Desktop requires a restart. Please restart your computer after installation completes."
    Write-Success "Docker Desktop installation initiated"
}

function Install-Git {
    param([string]$MissingPackage)
    
    if ($MissingPackage -ne "git") {
        return
    }
    
    Write-Info "Installing Git..."
    
    if (Test-CommandExists choco) {
        choco install git -y
    } else {
        Write-Info "Downloading Git..."
        $downloadUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.1/Git-2.42.0-64-bit.exe"
        $installerPath = "$env:TEMP\git-installer.exe"
        
        (New-Object System.Net.WebClient).DownloadFile($downloadUrl, $installerPath)
        
        Write-Info "Running Git installer..."
        Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT /NORESTART" -Wait
        
        Remove-Item $installerPath
    }
    
    Write-Success "Git installed"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-Dependencies {
    if (Check-Dependencies) {
        return
    }
    
    Write-Title "Step 3: Installing Missing Dependencies"
    
    if (-not (Read-Confirmation "Install missing dependencies?")) {
        Write-Error-Custom "Installation cancelled"
        exit 1
    }
    
    # Try to install Chocolatey first
    if (-not (Test-CommandExists choco)) {
        if (Read-Confirmation "Chocolatey is not installed. Install it for easier package management?") {
            Install-Chocolatey
        }
    }
    
    # Install missing packages
    Install-NodeJS -MissingPackage "node"
    Install-Docker -MissingPackage "docker"
    Install-Git -MissingPackage "git"
    
    Write-Success "Dependencies installation complete"
}

################################################################################
# REPOSITORY SETUP
################################################################################

function Setup-Repository {
    Write-Title "Step 4: Setting up Repository"
    
    $installDir = "$env:USERPROFILE\PlexArr"
    
    if (Test-Path $installDir) {
        Write-Warning "PlexArr already exists at $installDir"
        if (Read-Confirmation "Update existing installation?") {
            Push-Location $installDir
            git pull origin main
            Pop-Location
            Write-Success "Repository updated"
        }
    } else {
        $repoUrl = "https://github.com/neckbeard/PlexArr.git"
        Write-Info "Cloning PlexArr repository..."
        
        git clone $repoUrl $installDir
        Write-Success "Repository cloned to $installDir"
    }
    
    return $installDir
}

################################################################################
# APPLICATION SETUP
################################################################################

function Setup-Application {
    param([string]$InstallDir)
    
    Write-Title "Step 5: Setting up Application"
    
    Push-Location $InstallDir
    
    Write-Info "Installing npm dependencies..."
    npm install
    
    Write-Info "Building frontend..."
    Push-Location frontend
    npm run build
    Pop-Location
    
    Write-Success "Application setup complete"
    
    Pop-Location
}

################################################################################
# APPLICATION START
################################################################################

function Start-Application {
    param([string]$InstallDir)
    
    Write-Title "Step 6: Starting PlexArr"
    
    Push-Location $InstallDir
    
    Write-Info "Checking Docker daemon..."
    try {
        docker ps | Out-Null
        Write-Success "Docker is running"
    } catch {
        Write-Warning "Docker daemon is not running"
        if (Read-Confirmation "Start Docker Desktop?") {
            Start-Process "Docker Desktop"
            Write-Info "Waiting for Docker to start..."
            Start-Sleep -Seconds 10
        } else {
            Write-Error-Custom "Docker must be running to start PlexArr"
            Pop-Location
            exit 1
        }
    }
    
    Write-Info "Starting Docker containers..."
    docker compose up -d
    
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 5
    
    Write-Success "PlexArr is starting..."
    
    Pop-Location
}

function Open-Browser {
    Write-Info "Opening PlexArr in your browser..."
    Start-Sleep -Seconds 2
    
    try {
        Start-Process "http://localhost:3000"
    } catch {
        Write-Warning "Could not open browser automatically"
        Write-Info "Please visit: http://localhost:3000"
    }
}

################################################################################
# MAIN EXECUTION
################################################################################

function Main {
    Clear-Host
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║                                                        ║" -ForegroundColor Blue
    Write-Host "║   Welcome to PlexArr Installation for Windows          ║" -ForegroundColor Cyan
    Write-Host "║   Unified Plex Media Server Management                 ║" -ForegroundColor Cyan
    Write-Host "║                                                        ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "This script will install all necessary dependencies and set up" -ForegroundColor White
    Write-Host "PlexArr to run on your Windows system." -ForegroundColor White
    Write-Host ""
    
    # Step 1: Detect system
    Write-Title "Step 1: Detecting System"
    $sysInfo = Get-WindowsInfo
    
    # Step 2: Check dependencies
    Write-Title "Step 2: Checking Dependencies"
    Check-Dependencies
    
    # Step 3: Install missing dependencies
    Install-Dependencies
    
    # Verify installation
    Write-Title "Step 3: Verifying Installation"
    if (-not (Check-Dependencies)) {
        Write-Error-Custom "Some dependencies are still missing"
        Write-Info "Please install manually and try again"
        exit 1
    }
    
    # Step 4: Clone repository
    $installDir = Setup-Repository
    
    # Step 5: Setup application
    Setup-Application -InstallDir $installDir
    
    # Step 6: Start application
    Start-Application -InstallDir $installDir
    
    # Step 7: Open browser
    Open-Browser
    
    # Step 8: Show next steps
    Write-Host ""
    Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✓ PlexArr Installation Complete!" -ForegroundColor Green
    Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your PlexArr instance is running at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open http://localhost:3000 in your browser"
    Write-Host "2. Follow the Deployment Wizard to configure your services"
    Write-Host "3. The Post-Deployment Setup guide will walk you through the rest"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  Start PlexArr:   cd $installDir; docker compose up -d"
    Write-Host "  Stop PlexArr:    cd $installDir; docker compose down"
    Write-Host "  View logs:       cd $installDir; docker compose logs -f"
    Write-Host ""
    Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
}

# Execute main function
Main
