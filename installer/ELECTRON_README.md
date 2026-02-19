# PlexArr Installer - Electron Edition

This is the Electron-based version of the PlexArr installer, migrated from Tauri to provide better cross-platform compatibility and easier development.

## Why Electron?

The Tauri version required OS-level changes on some Linux systems, making it difficult to run on fresh installations. Electron provides:

- **Better compatibility**: Works on older hardware (Windows 10, Ubuntu 22, Debian 10, macOS Sequoia)
- **Simpler development**: No Rust compilation required
- **Easier debugging**: Node.js ecosystem and Chrome DevTools
- **Wider ecosystem**: Massive community and package availability

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
cd installer
npm install
```

### Run in Development Mode

```bash
npm run electron:dev
```

This starts both Vite (React UI) and Electron with hot reload.

### Build for Production

```bash
# Build for current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:linux    # Builds .deb and AppImage
npm run electron:build:win      # Builds .exe installer
npm run electron:build:mac      # Builds .dmg
```

## Architecture

### File Structure

```
installer/
├── electron/              # Electron main process
│   ├── main.ts           # Main process (Node.js)
│   └── preload.ts        # Preload script (IPC bridge)
├── src/                  # React UI (renderer process)
│   ├── components/
│   ├── services/
│   │   ├── platformAPI.ts           # Platform abstraction
│   │   └── installationService.ts   # Installation logic
│   └── types/
└── scripts/
    └── dev-electron.js   # Development build script
```

### Platform Abstraction

The `platformAPI.ts` service provides a unified interface that works with both Electron and Tauri (for backwards compatibility during migration):

```typescript
import { platformAPI } from './services/platformAPI';

// Works with both Electron and Tauri
const systemInfo = await platformAPI.getSystemInfo();
const result = await platformAPI.executeCommand('docker', ['ps']);
```

### IPC Communication

Electron uses IPC (Inter-Process Communication) between the main process (Node.js) and renderer process (React):

**Main Process** (`electron/main.ts`):
- Handles system operations (file I/O, command execution)
- Manages the application window
- Provides secure API via IPC

**Preload Script** (`electron/preload.ts`):
- Exposes safe API to renderer via `contextBridge`
- Acts as security layer between main and renderer

**Renderer Process** (React app):
- Uses `window.electronAPI` to call main process functions
- No direct access to Node.js APIs (security)

## Differences from Tauri

| Feature | Tauri | Electron |
|---------|-------|----------|
| Backend | Rust | Node.js |
| Package Size | ~10MB | ~150MB |
| Memory Usage | Lower | Higher |
| Development | Slower (Rust compilation) | Faster (no compilation) |
| Compatibility | Requires newer systems | Works on older systems |
| Debugging | Harder (Rust + Web) | Easier (all JavaScript) |

## Known Issues & Solutions

### 85% Installation Freeze

**Problem**: Installation gets stuck at 85% waiting for Docker services.

**Root Cause**: The Tauri version required specific OS configurations that weren't present on fresh systems.

**Solution**: Electron version uses native Node.js `child_process` which has better Docker compatibility and doesn't require special OS changes.

### Permission Issues

**Problem**: `sudo` commands failing or permission denied.

**Solution**: Electron properly handles password prompts through the UI and passes them to `sudo -S`.

## Migration from Tauri

If you have the Tauri version installed:

1. The Electron version uses the same UI and configuration
2. State files are compatible between versions
3. You can run both versions side-by-side for testing

## Troubleshooting

### Electron doesn't start in dev mode

Make sure Vite dev server is running on port 5173:
```bash
# Check if port is available
lsof -i :5173

# Kill any process using it
kill -9 <PID>
```

### Build fails on Linux

Install required dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y rpm

# For AppImage
sudo apt-get install -y libfuse2
```

### Docker commands failing

The installer needs Docker to be installed and running:
```bash
# Check Docker status
docker ps

# If Docker isn't installed, the installer will attempt to install it
```

## Contributing

When contributing to the Electron version:

1. Keep the `platformAPI` abstraction - it allows us to support both Electron and Tauri
2. Test on multiple platforms (Linux, Windows, macOS)
3. Use TypeScript strict mode
4. Follow the existing code style

## Support

For issues specific to the Electron version, please include:
- Operating system and version
- Electron version (`npm list electron`)
- Error logs from the console (DevTools)
- Installation log file (shown at 100% completion)
