# PlexArr Cross-Platform Installer

A Tauri-based desktop application that provides a seamless installation experience for PlexArr across Windows, macOS, and Linux.

## Features

### 🚀 Automatic Dependency Management
- **Download-on-Demand**: Small installer (~120MB) that downloads Docker/WSL2 only when needed
- **Platform Detection**: Automatically detects OS, architecture, and distribution
- **Smart Installation**: Handles Docker Desktop (Windows/macOS) and Docker Engine (Linux)
- **WSL2 Support**: Automatically installs and configures WSL2 on Windows

### 💾 State Persistence
- **Resume After Reboot**: Installation state is saved and automatically resumes
- **Resume After Re-login**: Handles user group changes that require re-authentication
- **Crash Recovery**: Can recover from unexpected failures

### 📋 Transparent Process
- **Clear Prerequisites**: Shows all system requirements upfront
- **Progress Tracking**: Real-time progress updates during installation
- **Detailed Logs**: Comprehensive logging for troubleshooting
- **Error Context**: Clear error messages with recovery options

### 🔧 Manual Fallback
- **Official Links**: Direct links to official Docker/WSL2 downloads
- **Step-by-Step Instructions**: Detailed manual installation guides
- **Copyable Commands**: One-click copy for terminal commands
- **Platform-Specific**: Tailored instructions for each OS and distribution

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **State Management**: JSON file in platform-specific app data directory
- **System Commands**: Rust backend with Tauri APIs

### Directory Structure
```
installer/
├── src/                      # React frontend
│   ├── components/          # UI components
│   ├── services/            # Business logic
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities and constants
├── src-tauri/               # Tauri backend
│   └── src/
│       └── main.rs          # Rust backend with system commands
├── public/                  # Static assets
└── dist/                    # Build output
```

## Development

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Platform-specific build tools:
  - **Windows**: Microsoft C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: build-essential, libssl-dev, libgtk-3-dev, libwebkit2gtk-4.0-dev

### Setup

1. Install dependencies:
```bash
cd installer
npm install
```

2. Run in development mode:
```bash
npm run tauri:dev
```

3. Build for production:
```bash
npm run tauri:build
```

### Build Output

Platform-specific installers will be generated in `src-tauri/target/release/bundle/`:

- **Windows**: `.exe` (NSIS installer) and `.msi`
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.AppImage`

## Installation Flow

### Windows
1. Check Windows version (Windows 10 2004+ required)
2. Check/Install WSL2
3. Reboot if needed (state persists)
4. Check/Install Docker Desktop
5. Verify installation
6. Install PlexArr

### macOS
1. Check macOS version (10.15+ required)
2. Detect architecture (Intel/Apple Silicon)
3. Check/Install Docker Desktop
4. Verify installation
5. Install PlexArr

### Linux
1. Detect distribution and version
2. Check/Install Docker Engine
3. Check/Install Docker Compose
4. Add user to docker group
5. Re-login if needed (state persists)
6. Verify installation
7. Install PlexArr

## Configuration

### Docker Download URLs

URLs are defined in `src/utils/constants.ts`:

```typescript
export const DOCKER_URLS = {
  windows: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
  macIntel: 'https://desktop.docker.com/mac/main/amd64/Docker.dmg',
  macAppleSilicon: 'https://desktop.docker.com/mac/main/arm64/Docker.dmg',
  linuxScript: 'https://get.docker.com',
};
```

### WSL2 URLs

```typescript
export const WSL2_URLS = {
  kernelUpdate: 'https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi',
};
```

**Note**: Update these URLs periodically to point to the latest stable versions.

## State File Format

The installer saves state to a JSON file in the platform-specific app data directory:

- **Windows**: `%APPDATA%\plexarr-installer\installation-state.json`
- **macOS**: `~/Library/Application Support/plexarr-installer/installation-state.json`
- **Linux**: `~/.local/share/plexarr-installer/installation-state.json`

### State Schema

```typescript
{
  version: 1,
  currentState: 'checking_prerequisites',
  systemInfo: { /* platform, arch, osVersion, etc */ },
  checks: [ /* prerequisite check results */ ],
  steps: [ /* installation steps */ ],
  dockerInstalled: false,
  wsl2Installed: false,
  errors: [],
  lastUpdated: 1234567890,
  resumeAfterReboot: false,
  resumeAfterRelogin: false
}
```

## Manual Instructions

The installer includes comprehensive manual installation instructions for:

- **Windows WSL2**: PowerShell commands and official documentation
- **Windows Docker**: Download links and installation steps
- **macOS Docker**: DMG installation for Intel and Apple Silicon
- **Linux Docker**: Distribution-specific installation (Ubuntu, Debian, Fedora, Arch)

All instructions include:
- Official download links
- Step-by-step guides
- Copyable terminal commands
- Troubleshooting tips

## Error Handling

### Error Codes

- `ERR_DISK_SPACE`: Insufficient disk space
- `ERR_OS_INCOMPATIBLE`: Incompatible operating system
- `ERR_DOWNLOAD_FAILED`: Failed to download dependencies
- `ERR_INSTALL_FAILED`: Installation failed
- `ERR_PERMISSION_DENIED`: Permission denied
- `ERR_WSL2_MISSING`: WSL2 not installed
- `ERR_DOCKER_MISSING`: Docker not installed
- `ERR_REBOOT_REQUIRED`: System reboot required
- `ERR_RELOGIN_REQUIRED`: User re-login required
- `ERR_NETWORK`: Network error

### Recovery Options

1. **Retry**: Attempt the installation again
2. **Manual Instructions**: Show detailed manual installation steps
3. **Copy Logs**: Copy error logs to clipboard
4. **Start Over**: Reset installation state

## Testing

### Platform Testing

Test on each platform:
- Windows 10 (2004+), Windows 11
- macOS 10.15+, macOS 11+ (Intel and Apple Silicon)
- Ubuntu 20.04+, Debian 11+, Fedora 35+, Arch Linux

### Test Scenarios

- [ ] Fresh installation (no Docker)
- [ ] Existing Docker installation
- [ ] WSL2 reboot flow (Windows)
- [ ] Docker group re-login flow (Linux)
- [ ] Download failures
- [ ] Installation failures
- [ ] State persistence after reboot
- [ ] State persistence after crash
- [ ] Manual instruction fallback

## Known Limitations

1. **Automatic Docker Installation**: Currently shows manual instructions instead of automatic installation (to be implemented)
2. **Download Progress**: Download progress tracking not yet implemented
3. **Bandwidth Throttling**: Not yet implemented
4. **Checksum Verification**: Not yet implemented

## Future Enhancements

- [ ] Implement actual download manager with progress tracking
- [ ] Add automatic Docker installation (not just instructions)
- [ ] Implement checksum verification for downloads
- [ ] Add bandwidth throttling options
- [ ] Create update mechanism for installer itself
- [ ] Add telemetry (opt-in) for installation success rates
- [ ] Implement rollback capabilities

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the root repository.

## License

MIT License - see [LICENSE](../LICENSE) in the root repository.

## Support

For issues and questions:
- GitHub Issues: https://github.com/nomnompewpew/PlexArr/issues
- Documentation: https://github.com/nomnompewpew/PlexArr#readme
