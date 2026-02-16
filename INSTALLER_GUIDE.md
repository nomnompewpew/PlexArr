# PlexArr Cross-Platform Installer

## Overview

The PlexArr Installer is a standalone desktop application that provides a seamless, zero-fuss installation experience for PlexArr on Windows, macOS, and Linux. It automatically handles all dependencies including Docker and WSL2, with intelligent fallback to manual instructions when needed.

## Key Features

### 🚀 **Double-Click Installation**
- Download a single ~120MB installer
- Run it - that's all!
- The installer handles everything else

### 📦 **Download-on-Demand**
- Small initial download
- Downloads Docker/WSL2 only if needed
- Shows clear progress for all downloads

### 🔄 **Resume After Reboot**
- Installation state is always saved
- Automatically resumes after:
  - System reboots (WSL2 on Windows)
  - User re-login (docker group on Linux)
  - Installer crashes or closures

### 📋 **Transparent Process**
- See exactly what's being checked
- Know what will be downloaded
- Understand why admin/sudo is needed
- View all logs and troubleshooting info

### 🛠️ **Smart Fallback**
- Automatic installation when possible
- Manual instructions with official links when needed
- Copy-to-clipboard for all commands
- Platform-specific guides for every scenario

### ✅ **Works Everywhere**
- **Windows**: 10 (2004+) and 11
- **macOS**: 10.15+ (Intel and Apple Silicon)
- **Linux**: Ubuntu, Debian, Fedora, Arch, and more

## What It Does

### On Windows
1. ✅ Checks Windows version
2. ✅ Installs WSL2 if needed (with reboot handling)
3. ✅ Installs Docker Desktop
4. ✅ Verifies everything works
5. ✅ Sets up PlexArr

### On macOS
1. ✅ Checks macOS version
2. ✅ Detects your Mac type (Intel or Apple Silicon)
3. ✅ Installs Docker Desktop for your architecture
4. ✅ Verifies everything works
5. ✅ Sets up PlexArr

### On Linux
1. ✅ Detects your distribution
2. ✅ Installs Docker Engine via your package manager
3. ✅ Installs Docker Compose
4. ✅ Adds you to the docker group (with re-login handling)
5. ✅ Verifies everything works
6. ✅ Sets up PlexArr

## User Experience

### Welcome Screen
- Shows your system information
- Explains what will happen
- Lists all features
- One "Start Installation" button

### Prerequisite Checks
- Real-time checking of system requirements
- Clear status for each requirement:
  - ✓ Passed
  - ✗ Failed (with fix button)
  - ○ Pending
- Disk space shown in GB
- One-click auto-fix for issues

### Installation Progress
- Current step clearly shown
- Progress bars for long operations
- Estimated time remaining
- Logs always available

### Reboot/Re-login Handling
- Clear explanation of why it's needed
- What happens after
- Automatic resume on restart
- No data loss

### Completion
- Success message
- Installation summary
- Next steps clearly listed
- Launch PlexArr button

### Error Handling
- Clear error messages
- Detailed logs
- Multiple recovery options:
  - Retry installation
  - View manual instructions
  - Copy error logs
  - Start over
- Direct link to support

## Installation Flow Examples

### Example 1: Windows (Fresh Install)

```
1. User downloads PlexArr-Installer.exe
2. Double-clicks to run
3. Sees welcome screen with system info
4. Clicks "Start Installation"
5. Installer checks:
   ✗ WSL2 not installed
   ✗ Docker Desktop not installed
6. User clicks "Install" on WSL2
7. Installer shows manual instructions:
   - Official Microsoft link
   - PowerShell commands
   - Step-by-step guide
8. User follows instructions and reboots
9. Installer automatically resumes
10. Checks show WSL2 now installed
11. User clicks "Install" on Docker
12. Installer shows manual instructions:
    - Official Docker Desktop link
    - Installation steps
13. User installs Docker Desktop
14. Installer verifies Docker is running
15. Installer sets up PlexArr
16. Success! User clicks "Launch PlexArr"
```

### Example 2: macOS (Docker Already Installed)

```
1. User downloads PlexArr-Installer.dmg
2. Opens and drags to Applications
3. Launches installer
4. Sees welcome screen
5. Clicks "Start Installation"
6. Installer checks:
   ✓ macOS 12.0 (compatible)
   ✓ Apple Silicon detected
   ✓ Docker Desktop installed
   ✓ 150GB disk space available
7. All checks pass!
8. Installer sets up PlexArr
9. Success! User clicks "Launch PlexArr"
```

### Example 3: Linux (Ubuntu, Need Docker)

```
1. User downloads PlexArr-Installer.AppImage
2. Makes it executable: chmod +x PlexArr-Installer.AppImage
3. Runs: ./PlexArr-Installer.AppImage
4. Sees welcome screen
5. Clicks "Start Installation"
6. Installer checks:
   ✗ Docker not installed
   ✗ Docker Compose not installed
   ✗ User not in docker group
7. User clicks "Install" on Docker
8. Installer shows manual instructions:
   - Official Docker installation script
   - Ubuntu-specific apt commands
   - All copyable with one click
9. User runs commands in terminal
10. Installer detects Docker is now installed
11. User clicks "Install" on Docker Compose
12. Installer shows apt install command
13. User installs Docker Compose
14. Installer adds user to docker group
15. Shows re-login message
16. User logs out and back in
17. Installer automatically resumes
18. All checks pass!
19. Installer sets up PlexArr
20. Success! User clicks "Launch PlexArr"
```

## Manual Instructions

When automatic installation isn't possible, the installer provides comprehensive manual guides:

### What You Get
- **Official Download Link**: Direct link to Docker/WSL2 installer
- **Step-by-Step Instructions**: Numbered, easy-to-follow steps
- **Copyable Commands**: One-click copy for terminal commands
- **Platform-Specific**: Tailored to your exact OS and distribution
- **Visual Guides**: Screenshots and diagrams where helpful

### Platforms Covered
- Windows 10/11 (WSL2 and Docker Desktop)
- macOS Intel and Apple Silicon (Docker Desktop)
- Ubuntu 20.04+ (Docker Engine)
- Debian 11+ (Docker Engine)
- Fedora 35+ (Docker Engine)
- Arch Linux (Docker Engine)
- Generic Linux (fallback instructions)

## State Persistence

### How It Works
The installer saves its progress to a JSON file after every step:

**Location:**
- Windows: `%APPDATA%\plexarr-installer\installation-state.json`
- macOS: `~/Library/Application Support/plexarr-installer/installation-state.json`
- Linux: `~/.local/share/plexarr-installer/installation-state.json`

**What's Saved:**
- Current installation state
- System information
- Prerequisite check results
- Installation steps completed
- Errors encountered
- Whether reboot/relogin is pending

**Benefits:**
- Survives system reboots
- Survives user re-logins
- Survives installer crashes
- Can resume from exact point
- No data loss ever

## System Requirements

### Minimum Requirements

**Disk Space:**
- 50GB free space (minimum)
- 70GB recommended (for Docker + images + media)

**Windows:**
- Windows 10 version 2004 (May 2020 Update) or later
- Windows 11 (any version)
- 64-bit processor with virtualization support

**macOS:**
- macOS 10.15 Catalina or later
- Intel or Apple Silicon Mac
- 4GB RAM minimum, 8GB recommended

**Linux:**
- Any modern distribution (Ubuntu, Debian, Fedora, Arch, etc.)
- Kernel 3.10 or later
- 64-bit architecture
- systemd (for Docker service management)

### Compatibility Matrix

| Platform | Version | Architecture | Docker | Status |
|----------|---------|--------------|--------|--------|
| Windows 10 | 2004+ | x64 | Desktop | ✅ Supported |
| Windows 11 | Any | x64 | Desktop | ✅ Supported |
| macOS | 10.15+ | Intel | Desktop | ✅ Supported |
| macOS | 11+ | Apple Silicon | Desktop | ✅ Supported |
| Ubuntu | 20.04+ | x64 | Engine | ✅ Supported |
| Debian | 11+ | x64 | Engine | ✅ Supported |
| Fedora | 35+ | x64 | Engine | ✅ Supported |
| Arch | Current | x64 | Engine | ✅ Supported |
| Other Linux | Modern | x64 | Engine | ⚠️ Manual |

## Troubleshooting

### Common Issues

**Issue: "Insufficient disk space"**
- **Cause**: Less than 50GB free
- **Solution**: Free up disk space or choose different install location

**Issue: "Windows version not compatible"**
- **Cause**: Windows 10 version older than 2004
- **Solution**: Update Windows to latest version

**Issue: "WSL2 installation failed"**
- **Cause**: Various (virtualization disabled, Windows update required)
- **Solution**: Follow manual WSL2 installation guide in installer

**Issue: "Docker Desktop won't start"**
- **Cause**: Various (Hyper-V, WSL2, permissions)
- **Solution**: Check Docker Desktop logs, reinstall if needed

**Issue: "Permission denied" (Linux)**
- **Cause**: Not in docker group
- **Solution**: Log out and log back in after installer adds you to group

**Issue: "Cannot download Docker"**
- **Cause**: Network issue, firewall, proxy
- **Solution**: Use manual installation with direct download link

### Getting Help

1. **Check Logs**: Installer provides detailed logs
2. **Copy Logs**: Use "Copy Error Logs" button
3. **GitHub Issues**: https://github.com/nomnompewpew/PlexArr/issues
4. **Include**:
   - Your OS and version
   - Error logs from installer
   - Steps you've tried

## Security & Privacy

### What The Installer Does

**Reads:**
- System information (OS, version, architecture)
- Disk space availability
- Installed software (Docker, WSL2)

**Writes:**
- Installation state file
- Installation logs
- (When installing) Docker and PlexArr

**Never:**
- Sends data to remote servers
- Collects personal information
- Runs without your knowledge
- Makes changes without asking

### Permissions Explained

**Why Administrator/sudo?**
- Installing WSL2 (Windows only)
- Installing Docker Desktop/Engine
- Adding user to docker group (Linux only)
- Starting system services

**When Asked:**
- Before every privileged operation
- With clear explanation of what and why
- With option to do it manually instead

## Building From Source

If you want to build the installer yourself:

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Platform-specific build tools

### Steps

```bash
# Clone repository
git clone https://github.com/nomnompewpew/PlexArr.git
cd PlexArr/installer

# Install dependencies
npm install

# Run in development
npm run tauri:dev

# Build for production
npm run tauri:build
```

**Output:** Platform-specific installers in `src-tauri/target/release/bundle/`

## Developer Documentation

For detailed technical documentation:
- [Installer README](installer/README.md) - Features and usage
- [Installer Architecture](installer/INSTALLER_ARCHITECTURE.md) - Technical details
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

## Roadmap

### Current Version (v1.0)
- ✅ Platform detection
- ✅ Prerequisite checking
- ✅ Manual instruction system
- ✅ State persistence
- ✅ Reboot/relogin handling
- ✅ Comprehensive UI

### Planned for v1.1
- [ ] Automatic Docker download
- [ ] Automatic installation execution
- [ ] Download progress bars
- [ ] Checksum verification
- [ ] Bandwidth throttling

### Future Ideas
- [ ] Installer auto-update
- [ ] Docker version selection
- [ ] Offline installation mode
- [ ] Installation profiles (quick/custom)
- [ ] Proxy support

## License

MIT License - See [LICENSE](LICENSE) for details

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop application framework
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety

Downloads from official sources:
- [Docker](https://docker.com/) - Container platform
- [Microsoft WSL2](https://docs.microsoft.com/en-us/windows/wsl/) - Windows Subsystem for Linux

---

Made with ❤️ for the selfhosted community by the PlexArr team
