# PlexArr Development - Next Steps & Priority Roadmap

## 📋 Current Status

The previous agent has completed:
- ✅ Tauri-based cross-platform installer (Windows, macOS, Linux)
- ✅ AI Agent integration (Google Gemini, OpenAI, Claude)
- ✅ Post-Deployment Wizard with automated configuration
- ✅ Download client expansion (qBittorrent, MeTube, NZBGet Music)
- ✅ Enhanced Dashboard with container monitoring
- ✅ Comprehensive test coverage (13 tests, all passing)
- ✅ Full documentation (user & developer guides)

---

## 🎯 Priority 1: Installer Automation (v1.1)

**Status**: Architecture complete, manual fallback functional
**Focus**: Make the installer actually download and install dependencies

### Immediate Tasks:
- [ ] **Implement actual download manager**
  - Download Docker, WSL2, and other dependencies
  - Support pause/resume
  - Cache management
  
- [ ] **Automatic installation execution**
  - Run downloaded installers
  - Handle platform-specific installation scripts
  - Verify successful installation via exit codes & file checks

- [ ] **Download progress indicators**
  - Show real-time progress bars
  - Display ETA and speed
  - Handle cancellation gracefully

- [ ] **Checksum verification**
  - Verify downloaded files match official checksums
  - Fail-safe if checksum doesn't match
  - Support resuming from checksum failure

- [ ] **Bandwidth throttling**
  - Allow users to limit download speed (optional)
  - Prevent network saturation

- [ ] **Build & package for all platforms**
  - Windows: `.exe` and `.msi` installers
  - macOS: `.dmg` and `.app` bundles
  - Linux: `.deb` and `.AppImage` packages

- [ ] **Integration testing**
  - Test on Windows (with/without WSL2)
  - Test on macOS (Intel & Apple Silicon)
  - Test on Linux (Ubuntu, Debian, Fedora, Arch)

- [ ] **Release artifacts**
  - Sign binaries
  - Create release notes
  - GitHub Releases setup

**Files to Work On**:
- `installer/src/services/` - Add download manager service
- `installer/src-tauri/src/` - Add Rust-side download & installation logic
- `installer/src/components/` - Update UI for real progress

---

## 🎯 Priority 2: Docker Compose Integration Enhancements

**Status**: Basic integration complete
**Focus**: Improve stack management and monitoring

### Tasks:
- [ ] **Real-time log streaming**
  - WebSocket connection for live log updates
  - File watching for compose logs
  - Filter by container/service

- [ ] **Docker Compose file editing**
  - UI editor with YAML syntax highlighting
  - Live validation before save
  - Diff viewer for changes

- [ ] **Stack backup/restore**
  - Export entire stack to zip file
  - Import previously exported configs
  - Version history tracking

- [ ] **Multi-stack support**
  - Allow multiple PlexArr stacks on same host
  - Stack switcher in UI
  - Independent configuration per stack

- [ ] **Advanced monitoring**
  - CPU/Memory usage per container
  - Network I/O monitoring
  - Uptime tracking
  - Alerts on service failure

- [ ] **Web terminal**
  - Direct shell access to containers
  - Execute commands in real-time
  - Limited/sandboxed for security

**Files to Work On**:
- `backend/src/services/stack-manager.service.ts` - Enhance functionality
- `frontend/src/components/Dashboard.tsx` - Add new monitoring features
- `frontend/src/pages/` - Add new management pages

---

## 🎯 Priority 3: AI Agent Enhancements

**Status**: Basic integration complete (analysis, recommendations)
**Focus**: Intelligent automation and proactive management

### Tasks:
- [ ] **Automatic indexer configuration**
  - AI suggests ideal indexers for user's region/services
  - One-click application to Prowlarr
  - Auto-test indexer connections

- [ ] **One-click quality profile application**
  - AI recommends optimal quality settings
  - Auto-apply to Radarr/Sonarr/Lidarr
  - Save presets for future use

- [ ] **Proactive health monitoring**
  - AI analyzes logs for potential issues
  - Alert before service failure
  - Suggest preventive actions

- [ ] **Multi-language support**
  - UI in multiple languages
  - AI responses in user's language preference

- [ ] **Local LLM support**
  - Support Ollama or similar local models
  - No API key required
  - Privacy-first option

**Files to Work On**:
- `backend/src/services/ai-agent.service.ts` - Expand capabilities
- `backend/src/routes/ai-agent.routes.ts` - Add new endpoints
- `frontend/src/components/steps/AIAgentStep.tsx` - Enhanced UI

---

## 🎯 Priority 4: Testing & Release

**Status**: Unit tests complete, integration/e2e needed
**Focus**: Production readiness and quality assurance

### Tasks:
- [ ] **Manual testing checklist**
  - Fresh installation on each platform
  - Upgrade from existing installations
  - Error recovery scenarios
  - Resume after reboot/relogin

- [ ] **Integration tests**
  - Installer → Docker → PlexArr app flow
  - Service connectivity tests
  - API key extraction verification
  - Post-deployment wizard automation

- [ ] **End-to-end tests**
  - Complete user scenarios
  - Error handling paths
  - Performance benchmarks

- [ ] **Merge & release as v2.0.0**
  - Update version numbers
  - Create CHANGELOG entry
  - Tag release in git
  - GitHub release with notes

**Documentation to Update**:
- `README.md` - v2.0.0 features
- `CHANGELOG.md` - Complete changelog
- `QUICKSTART.md` - Updated quickstart

---

## 🎯 Priority 5: Platform-Specific Enhancements

### Windows-Specific:
- [ ] Windows Terminal integration
- [ ] Scheduled automatic updates
- [ ] Windows Task Scheduler integration

### macOS-Specific:
- [ ] Notarization & code signing
- [ ] Launchd integration
- [ ] Spotlight indexing

### Linux-Specific:
- [ ] systemd service files
- [ ] SELinux compatibility
- [ ] snap/flatpak support

---

## 📊 Dependency Map

```
Installer v1.1 (Downloads/Installation)
    └── Should complete BEFORE Priority 4 (Testing)
    
Docker Integration Enhancements
    └── Real-time features may depend on installer completion
    
AI Agent Enhancements
    └── Can progress in parallel with installer work
    
Testing & Release
    └── Requires installer v1.1 completion
    └── Requires at least 2 of the other features stable
```

---

## 🚀 Suggested Approach

### Phase 1 (Weeks 1-2): Installer Automation
1. Start with actual download manager implementation
2. Build out platform-specific installation logic
3. Test on Windows (easiest to debug remotely)
4. Add progress UI components
5. Implement checksum verification

### Phase 2 (Weeks 2-3): AI Agent Enhancements
1. Add automatic indexer configuration
2. Implement quality profile recommendations
3. Build one-click application features
4. Test with real Prowlarr/Radarr instances

### Phase 3 (Week 4): Docker Integration
1. Add real-time log streaming
2. Implement Docker Compose editor
3. Add backup/restore functionality
4. Build multi-stack support foundation

### Phase 4 (Week 5): Testing & Release
1. Manual testing on all platforms
2. Integration test suite
3. Fix issues from testing
4. Release v2.0.0

---

## 📝 Code Organization Notes

### Key Files for Next Steps:

**Installer**:
- `installer/src/services/` - Where to add new services
- `installer/src-tauri/src/main.rs` - Rust backend
- `installer/src/components/InstallationScreen.tsx` - UI for progress

**Backend (AI & Docker)**:
- `backend/src/services/ai-agent.service.ts` - AI logic expansion
- `backend/src/services/stack-manager.service.ts` - Docker management
- `backend/src/routes/` - API endpoints

**Frontend**:
- `frontend/src/components/Dashboard.tsx` - Main monitoring UI
- `frontend/src/pages/PostDeploymentWizard.tsx` - Post-deployment automation
- `frontend/src/components/steps/` - Individual wizard steps

---

## 🔗 Related Documentation

- [INSTALLER_IMPLEMENTATION_SUMMARY.md](INSTALLER_IMPLEMENTATION_SUMMARY.md) - Current installer status & v1.1 roadmap
- [DOCKGE_INTEGRATION.md](DOCKGE_INTEGRATION.md) - Docker integration details & enhancements
- [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) - AI agent setup & future features
- [IMPLEMENTATION_SUMMARY_ROADMAP.md](IMPLEMENTATION_SUMMARY_ROADMAP.md) - Feature delivery summary

---

## ✅ Quick Checklist

**Before starting:**
- [ ] Review INSTALLER_IMPLEMENTATION_SUMMARY.md section "What's Next (v1.1 Roadmap)"
- [ ] Review DOCKGE_INTEGRATION.md section "Next Steps / Potential Enhancements"
- [ ] Check installer/README.md for development setup
- [ ] Verify all tests still pass: `npm test` in backend & installer

**Recommended first task:**
- Start with actual download manager implementation in the installer
- This is the foundation for v1.1 and will unblock testing/release phase

