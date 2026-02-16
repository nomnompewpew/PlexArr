# PlexArr Installer Architecture

## Overview

The PlexArr Installer is a cross-platform desktop application built with Tauri that provides a seamless installation experience for PlexArr across Windows, macOS, and Linux. It implements a download-on-demand strategy, state persistence, and comprehensive error handling with manual fallback options.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (React + TypeScript)                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Welcome    │→ │ Prerequisites │→ │ Installation │         │
│  │   Screen     │  │    Screen     │  │   Screen     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Completed   │  │    Error     │                            │
│  │   Screen     │  │   Screen     │                            │
│  └──────────────┘  └──────────────┘                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Tauri API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                             │
│                      (TypeScript)                               │
│                                                                 │
│  ┌────────────────────┐  ┌────────────────────┐               │
│  │  State Service     │  │ Prerequisite Svc   │               │
│  │  - Load/Save       │  │ - Check Docker     │               │
│  │  - Persistence     │  │ - Check WSL2       │               │
│  │  - Migration       │  │ - Check Disk       │               │
│  └────────────────────┘  └────────────────────┘               │
│                                                                 │
│  ┌────────────────────────────────────────────┐               │
│  │      Installation Orchestrator             │               │
│  │  - Step sequencing                         │               │
│  │  - Error handling                          │               │
│  │  - State transitions                       │               │
│  └────────────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ invoke()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Tauri Backend                              │
│                         (Rust)                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  System Commands                                        │   │
│  │  - get_system_info()   - OS, arch, version             │   │
│  │  - check_disk_space()  - Disk availability             │   │
│  │  - execute_command()   - Run system commands           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  File System Access                                     │   │
│  │  - Read/Write state file                                │   │
│  │  - Read OS-specific config files                        │   │
│  │  - Manage download directory                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Operating System                            │
│                                                                 │
│  Windows:           macOS:              Linux:                  │
│  - WSL2 commands    - sw_vers          - lsb_release            │
│  - PowerShell       - DMG install      - apt/dnf/pacman         │
│  - Docker Desktop   - Docker Desktop   - Docker Engine          │
│  - WMI queries      - Homebrew         - systemd                │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine

### States

```
INITIAL
  ↓
CHECKING_PREREQUISITES
  ↓
DOWNLOADING_DEPENDENCIES (if needed)
  ↓
[Windows Path]              [macOS Path]           [Linux Path]
INSTALLING_WSL2             INSTALLING_DOCKER      INSTALLING_DOCKER
  ↓                           ↓                      ↓
REBOOTING_FOR_WSL2         CONFIGURING_DOCKER     CONFIGURING_DOCKER
  ↓ (resume)                  ↓                      ↓
INSTALLING_DOCKER          INSTALLING_PLEXARR     ADDING_TO_DOCKER_GROUP
  ↓                           ↓                      ↓
CONFIGURING_DOCKER         COMPLETED              RELOGIN_REQUIRED
  ↓                                                  ↓ (resume)
INSTALLING_PLEXARR                                INSTALLING_PLEXARR
  ↓                                                  ↓
COMPLETED                                         COMPLETED

[Error Path from any state]
  ↓
FAILED
```

### State Transitions

Each state transition is:
1. **Validated**: Ensures prerequisites for the next state are met
2. **Persisted**: State is saved to disk before and after transition
3. **Logged**: All transitions are logged for debugging
4. **Recoverable**: Can resume from any state after interruption

## Data Flow

### 1. Initialization Flow
```
App Start
  → StateService.loadState()
  → Check for resumeAfterReboot/resumeAfterRelogin
  → Render appropriate screen based on currentState
```

### 2. Prerequisite Check Flow
```
User clicks "Start Installation"
  → PrerequisiteService.checkAll()
  → For each platform:
    → Check disk space
    → Check platform-specific requirements
    → Return PrerequisiteCheck[]
  → Update state with checks
  → Render PrerequisiteScreen
```

### 3. Installation Flow
```
User clicks "Continue" (prerequisites passed)
  → InstallationOrchestrator.start()
  → For each installation step:
    → Update step status to 'in_progress'
    → Execute platform-specific installation
    → On success: status = 'completed'
    → On failure: status = 'failed', show manual instructions
    → Save state after each step
  → Move to next state
```

### 4. Error Handling Flow
```
Installation Error
  → Catch error
  → Add to state.errors[]
  → Set currentState = 'failed'
  → Save state
  → Render ErrorScreen with:
    → Error details
    → Manual instructions
    → Retry option
    → Reset option
```

### 5. Resume Flow
```
App Start (after reboot/relogin)
  → StateService.loadState()
  → Detect resumeAfterReboot or resumeAfterRelogin
  → Re-verify prerequisites
  → Continue from currentState
  → Clear resume flag
  → Save state
```

## Component Architecture

### UI Components

```typescript
App.tsx
├── WelcomeScreen
│   └── Shows system info, features, start button
├── PrerequisiteScreen
│   ├── Displays prerequisite checks
│   ├── Auto-fix buttons for failed checks
│   └── Manual instructions modal
├── InstallationScreen
│   ├── Shows current installation step
│   ├── Progress indicators
│   └── Reboot/relogin messages
├── CompletedScreen
│   ├── Installation summary
│   ├── Next steps
│   └── Launch PlexArr button
└── ErrorScreen
    ├── Error details
    ├── Recovery options
    └── Manual installation link
```

### Service Layer

```typescript
StateService
├── loadState(): Load from disk or create initial state
├── saveState(): Persist state to JSON file
├── migrateState(): Handle state version migrations
├── getSystemInfo(): Detect OS, arch, version
└── clearState(): Reset for fresh installation

PrerequisiteService
├── checkAll(): Check all prerequisites for platform
├── checkDiskSpace(): Verify sufficient disk space
├── checkWindowsPrerequisites(): WSL2, Docker, Hyper-V
├── checkMacOSPrerequisites(): Version, Docker
└── checkLinuxPrerequisites(): Docker, Compose, group
```

## Platform-Specific Implementation

### Windows

**Prerequisites:**
- Windows 10 version 2004 or later
- WSL2 kernel update
- Docker Desktop
- Hyper-V (optional, Docker Desktop handles it)

**Installation Steps:**
1. Check Windows version
2. Install WSL2 if missing
   - Download WSL2 kernel update MSI
   - Execute installer
   - May require reboot → save state, resume after
3. Install Docker Desktop
   - Download Docker Desktop installer
   - Execute silent install: `Docker Desktop Installer.exe install --quiet`
   - Wait for Docker to start
4. Verify Docker with `docker --version`

**State Persistence:**
- Path: `%APPDATA%\plexarr-installer\installation-state.json`
- Survives reboots, resume automatic on next launch

### macOS

**Prerequisites:**
- macOS 10.15 Catalina or later
- Intel or Apple Silicon architecture detection
- Docker Desktop for Mac

**Installation Steps:**
1. Check macOS version with `sw_vers`
2. Detect architecture (Intel vs Apple Silicon)
3. Download appropriate Docker Desktop DMG
4. Mount DMG and copy to Applications
   - Or use `hdiutil` for programmatic install
5. Launch Docker Desktop
6. Wait for Docker daemon to start

**State Persistence:**
- Path: `~/Library/Application Support/plexarr-installer/installation-state.json`

### Linux

**Prerequisites:**
- Supported distribution (Ubuntu, Debian, Fedora, Arch)
- Kernel 3.10+ (for Docker)
- Docker Engine
- Docker Compose (plugin or standalone)
- User in docker group

**Installation Steps:**
1. Detect distribution from `/etc/os-release`
2. Install Docker Engine via package manager
   - Ubuntu/Debian: `apt-get install docker-ce`
   - Fedora: `dnf install docker-ce`
   - Arch: `pacman -S docker`
   - Or use `curl -fsSL https://get.docker.com | sh`
3. Start Docker service
   - `systemctl start docker`
   - `systemctl enable docker`
4. Install Docker Compose if missing
   - Plugin: `apt-get install docker-compose-plugin`
   - Standalone: Download binary
5. Add user to docker group
   - `usermod -aG docker $USER`
   - Requires re-login → save state, detect on resume
6. Detect PUID/PGID with `id -u` and `id -g`

**State Persistence:**
- Path: `~/.local/share/plexarr-installer/installation-state.json`

## Manual Instruction Templates

### Structure
```typescript
interface ManualInstructions {
  title: string;              // e.g., "Install Docker Desktop for Windows"
  description: string;        // Plain language explanation
  officialUrl: string;        // Official download/documentation link
  steps: string[];            // Step-by-step instructions
  copyableCommands?: string[]; // Commands user can copy
}
```

### Templates Provided
- `WINDOWS_WSL2`: Install WSL2 with PowerShell
- `WINDOWS_DOCKER`: Download and install Docker Desktop
- `MACOS_DOCKER`: Install Docker Desktop on macOS
- `LINUX_DOCKER_UBUNTU`: Docker installation for Ubuntu/Debian
- `LINUX_DOCKER_FEDORA`: Docker installation for Fedora
- `LINUX_DOCKER_ARCH`: Docker installation for Arch Linux

### Usage
When automatic installation fails or user chooses "Manual Installation":
1. Show ManualInstructionsModal
2. Display relevant template based on platform/check
3. Include official download link (clickable)
4. Show numbered steps
5. Provide copyable commands
6. Allow user to copy entire instructions

## Error Handling Strategy

### Error Types

1. **Recoverable Errors**: Can retry
   - Network errors during download
   - Temporary permission issues
   - Service not ready

2. **User Action Required**: Cannot auto-fix
   - Insufficient disk space
   - Incompatible OS version
   - Reboot required
   - Re-login required

3. **Fatal Errors**: Must restart
   - State file corruption
   - Unsupported platform
   - Critical system failure

### Error Handling Flow

```typescript
try {
  await performInstallationStep();
} catch (error) {
  // Log error
  logError(error);
  
  // Add to state
  state.errors.push(error.message);
  
  // Determine error type
  if (isRecoverable(error)) {
    // Show retry button
    return { canRetry: true, manualInstructions: null };
  } else if (requiresUserAction(error)) {
    // Show manual instructions
    return { canRetry: false, manualInstructions: getInstructions(error) };
  } else {
    // Fatal error, show reset option
    state.currentState = 'failed';
    return { canRetry: false, mustReset: true };
  }
}
```

### User-Facing Errors

All errors shown to user include:
- **What happened**: Clear description of the error
- **Why it happened**: Context about the failure
- **What to do**: Specific recovery actions
- **Official resources**: Links to documentation

## Security Considerations

### Permissions

1. **Windows**: May require Administrator for:
   - WSL2 installation
   - Docker Desktop installation
   - Hyper-V enablement

2. **macOS**: May require sudo for:
   - Installing to /Applications
   - Starting Docker daemon

3. **Linux**: May require sudo for:
   - Package manager operations
   - Adding user to docker group
   - Starting Docker service

### User Consent

- **Always ask**: Before requiring elevated permissions
- **Explain why**: Clear reason for permission request
- **Show what**: Exact command that will be executed
- **Allow decline**: Provide manual alternative

### Download Safety

- **Official sources only**: All downloads from Docker/Microsoft
- **HTTPS only**: All downloads over secure connections
- **Checksum verification**: (To be implemented)
- **User notification**: Show download URL before downloading

## Testing Strategy

### Unit Tests
- State service save/load
- Prerequisite checks (mocked)
- State machine transitions
- Error handling logic

### Integration Tests
- Full installation flow (mocked installers)
- Resume after reboot (simulated)
- Error recovery paths
- Manual instruction fallback

### Platform Tests
- Windows 10, Windows 11
- macOS 10.15+, macOS 11+ (Intel and Apple Silicon)
- Ubuntu 20.04+, Debian 11+, Fedora 35+, Arch Linux

### Edge Cases
- No internet connection
- Insufficient disk space
- Incompatible OS version
- Docker already installed
- WSL2 already installed
- Download interruptions
- Installation failures
- State file corruption

## Performance Considerations

### Startup Time
- Target: < 2 seconds to show UI
- State file loading optimized
- Lazy load heavy dependencies

### Installation Time
- Varies by platform and existing setup
- Typical: 5-15 minutes
- Progress indicators for long operations
- Background downloads when possible

### Memory Usage
- Target: < 200MB RAM during installation
- Rust backend: Minimal overhead
- React frontend: Optimized renders

### Disk Usage
- Installer: ~120MB
- State file: < 1MB
- Downloads: ~500MB-1GB (Docker installers)
- Temporary files cleaned up after installation

## Future Enhancements

### Phase 2 (Planned)
- [ ] Actual download manager with progress bars
- [ ] Automatic Docker installation (not just instructions)
- [ ] Checksum verification for downloads
- [ ] Retry logic with exponential backoff
- [ ] Bandwidth throttling options

### Phase 3 (Ideas)
- [ ] Installer auto-update mechanism
- [ ] Installation analytics (opt-in)
- [ ] Docker version selection
- [ ] Proxy support for downloads
- [ ] Offline installation mode
- [ ] Installation profiles (quick/custom/advanced)

## Maintenance

### Updating Docker URLs

Edit `src/utils/constants.ts`:

```typescript
export const DOCKER_URLS: DockerDownloadUrls = {
  windows: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
  macIntel: 'https://desktop.docker.com/mac/main/amd64/Docker.dmg',
  macAppleSilicon: 'https://desktop.docker.com/mac/main/arm64/Docker.dmg',
  linuxScript: 'https://get.docker.com',
};
```

### State Schema Migration

When changing state structure:

1. Increment `STATE_VERSION` in `stateService.ts`
2. Add migration logic in `migrateState()`:

```typescript
private migrateState(state: InstallationStateData): InstallationStateData {
  if (state.version < 2) {
    // Add new field with default value
    state.newField = defaultValue;
  }
  
  state.version = STATE_VERSION;
  return state;
}
```

### Adding New Platform Support

1. Add platform type to `types/installer.ts`
2. Add prerequisite checks in `prerequisiteService.ts`
3. Add manual instructions in `constants.ts`
4. Update UI to handle new platform
5. Test thoroughly on target platform

## Documentation

### For Users
- Installation guide (README.md)
- Troubleshooting guide
- FAQ
- Video walkthrough

### For Developers
- Architecture (this document)
- API reference
- Build instructions
- Contributing guide
- Release process

## Support

For questions and issues:
- GitHub Issues: Technical problems, bugs
- Discussions: Feature requests, questions
- Documentation: Setup and usage help
