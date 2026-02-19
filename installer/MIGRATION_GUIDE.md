# Migration Guide: Tauri → Electron

This guide explains the migration from Tauri to Electron in the PlexArr installer.

## Quick Start

### For Development

```bash
cd installer

# Install dependencies (removes Tauri, adds Electron)
npm install

# Run in dev mode
npm run electron:dev
```

### For Production Build

```bash
# Build for current platform
npm run electron:build

# Platform-specific builds
npm run electron:build:linux
npm run electron:build:win  
npm run electron:build:mac
```

## What Changed

### Dependencies

**Removed:**
- `@tauri-apps/api`
- `@tauri-apps/cli`
- `tauri` package

**Added:**
- `electron`
- `electron-builder`
- `esbuild`
- `concurrently`

### File Structure

```
New Files:
├── electron/
│   ├── main.ts              # Replaces src-tauri/src/main.rs
│   └── preload.ts           # Security/IPC bridge
├── scripts/
│   └── dev-electron.js      # Dev build script
├── tsconfig.electron.json   # TypeScript config for Electron
├── src/services/
│   ├── platformAPI.ts       # NEW: Unified API (works with both!)
│   └── installationService-electron.ts  # Electron version
└── ELECTRON_README.md

Can be removed (optional):
├── src-tauri/               # Old Rust backend
└── tauri.conf.json
```

### Code Changes

#### Before (Tauri):

```typescript
import { invoke } from '@tauri-apps/api/tauri';

const systemInfo = await invoke('get_system_info');
const result = await invoke('execute_command', {
  command: 'docker',
  args: ['ps']
});
```

#### After (Electron - Platform Abstraction):

```typescript
import { platformAPI } from './services/platformAPI';

// Automatically detects Electron or Tauri!
const systemInfo = await platformAPI.getSystemInfo();
const result = await platformAPI.executeCommand('docker', ['ps']);
```

The `platformAPI` provides a unified interface that works with BOTH frameworks, making migration gradual and testable.

## Service Migration

### installationService.ts

The `installationService-electron.ts` is the Electron version. To switch:

1. **Option A**: Use platformAPI (recommended)
   ```typescript
   import { platformAPI } from './platformAPI';
   // Use platformAPI instead of invoke/window.electronAPI
   ```

2. **Option B**: Use Electron directly
   ```typescript
   // Uses window.electronAPI (defined in preload.ts)
   await window.electronAPI.executeCommand('docker', ['ps']);
   ```

### prerequisiteService.ts & stateService.ts

Update imports to use `platformAPI`:

```typescript
// Old
import { invoke } from '@tauri-apps/api/tauri';
const result = await invoke('execute_command', {...});

// New  
import { platformAPI } from './platformAPI';
const result = await platformAPI.executeCommand('command', ['args']);
```

## Benefits of This Approach

### 1. **Backwards Compatible**
- platformAPI detects which framework is available
- Can run Tauri OR Electron version with same code
- Easy A/B testing

### 2. **Gradual Migration**
- Don't need to change everything at once
- Update components one at a time
- Both versions work during transition

### 3. **Better Debugging**
```typescript
console.log('Framework:', platformAPI.getFramework());
// Output: "electron" or "tauri"
```

## Testing Both Versions

### Test Tauri:
```bash
npm run tauri:dev
```

### Test Electron:
```bash
npm run electron:dev
```

### Using platformAPI

The app will automatically use the right backend!

## Common Issues & Solutions

### Issue: "window.electronAPI is undefined"

**Cause**: Trying to run Electron code in browser/Tauri

**Solution**: Use platformAPI instead of direct electronAPI:
```typescript
// Bad
await window.electronAPI.executeCommand(...);

// Good
await platformAPI.executeCommand(...);
```

### Issue: Build fails with Tauri errors

**Cause**: Old Tauri dependencies still cached

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Electron shows blank screen

**Cause**: Vite not building correctly or wrong path

**Solution**: Check `vite.config.ts` has `base: './'`

## Performance Comparison

| Metric | Tauri | Electron |
|--------|-------|----------|
| First build time | ~5 min (Rust) | ~1 min |
| Dev startup | ~30s | ~5s |
| Hot reload | 3-5s | <1s |
| Final package (.deb) | ~10MB | ~150MB |
| Memory usage | ~80MB | ~200MB |
| Compatibility | Linux with specific deps | Any Linux |

## Which Should I Use?

### Use Electron if:
- ✅ You need broad compatibility (older systems)
- ✅ You value fast development iteration
- ✅ You're comfortable with larger package sizes
- ✅ You had issues with Tauri on fresh systems (like the 85% bug)

### Use Tauri if:
- ✅ Package size is critical
- ✅ You're targeting newer systems only
- ✅ Lower memory usage is important
- ✅ You have Rust expertise

## Migration Checklist

- [ ] Install Electron dependencies (`npm install`)
- [ ] Build Electron main process (`npm run build:electron`)
- [ ] Update services to use `platformAPI`
- [ ] Test in dev mode (`npm run electron:dev`)
- [ ] Test on a fresh system (new VM/container)
- [ ] Build production package (`npm run electron:build:linux`)
- [ ] Test installation on target system
- [ ] Update documentation
- [ ] (Optional) Remove src-tauri directory

## Need Help?

- Check [ELECTRON_README.md](./ELECTRON_README.md) for detailed docs
- See [platformAPI.ts](./src/services/platformAPI.ts) for API reference
- Compare [installationService.ts](./src/services/installationService.ts) vs [installationService-electron.ts](./src/services/installationService-electron.ts)

## Next Steps

1. Test the Electron version on your problematic system
2. If it works, gradually migrate all services to use platformAPI
3. Eventually you can remove Tauri dependencies entirely
4. Or keep both options and let users choose!
