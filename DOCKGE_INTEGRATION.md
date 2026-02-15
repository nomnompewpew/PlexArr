# PlexArr - Dockge-Inspired Architecture Implementation

## Overview
Successfully integrated Dockge's container management architecture into PlexArr. The system now stores compose files on the host filesystem, manages container lifecycle, streams logs, and provides an intelligent dashboard for monitoring and controlling the deployed stack.

## Key Changes Implemented

### 1. **Project Folder Configuration** ✅
- Added `projectFolder` field to `SystemConfig` across all type definitions
- Defaults to `/opt/plexarr` on the host
- Specified early in the System Configuration step of the wizard
- User can customize where the stack files are stored on their host

**Files Modified:**
- `backend/src/models/config.ts` - Added projectFolder to SystemConfig
- `backend/src/models/config.model.ts` - Added projectFolder to SystemConfig  
- `backend/src/models/config-defaults.ts` - Set default value
- `frontend/src/types/config.types.ts` - Added projectFolder to SystemConfig
- `frontend/src/types/plexarr-config.types.ts` - Added projectFolder to SystemConfig
- `frontend/src/pages/WizardPage.tsx` - Added Project Folder input in System step

### 2. **Host Volume Mounting** ✅
- Updated `docker-compose.yml` to mount host project folder into backend container
- Mapping: `${PROJECT_FOLDER}:/opt/plexarr` (dynamically configurable)
- Docker socket already mounted for container management
- Enables persistence of compose files on host filesystem

**Files Modified:**
- `docker-compose.yml` - Added stacks directory volume mount, set STACKS_DIR env var

### 3. **Stack Manager Service** ✅
Created a Dockge-inspired `StackManager` service in TypeScript that handles:

**Core Functionality:**
- Directory management on host filesystem (create/validate)
- Docker Compose file persistence (read/write)
- Stack lifecycle operations (up/down/start/stop/restart)
- Container status tracking (real-time state)
- Container logs retrieval (per-service and aggregate)
- Service directory creation (with correct permissions)
- Network management (create external network)
- Image updates (pull latest)

**Files Created:**
- `backend/src/services/stack-manager.service.ts` - Full implementation

**Key Methods:**
```typescript
// File operations
getStackPath()              // /opt/plexarr/plexarr-stack
getComposePath()            // /opt/plexarr/plexarr-stack/compose.yml
saveComposeFile(yaml)       // Persist to host
readComposeFile()           // Load from host

// Stack operations
deploy()                    // docker compose up -d
stop()                      // docker compose stop
start()                     // docker compose start
restart()                   // docker compose restart
down(removeVolumes?)        // docker compose down
pull()                      // docker compose pull

// Monitoring
getStatus()                 // Get all containers status
getLogs(service)            // Get logs for specific service
getAllLogs()                // Get all service logs

// Utilities
ensureStackDirectory()      // Mkdir -p with proper perms
ensureNetwork()             // Create external network
createServiceDirectories()  // Create volume paths
validateStacksDir()         // Check folder exists & writable
```

### 4. **Enhanced Deployment Routes** ✅
Updated `/api/deploy-new/*` endpoints to use StackManager:

**Modified Endpoints:**
- `POST /api/deploy-new/execute` - Now writes compose to host and deploys
  - Validates project folder exists & is writable
  - Creates all service directories with correct permissions
  - Returns stack path and compose location

**New Endpoints:**
- `GET /api/deploy-new/status` - Get container status
  - Returns: stack name, overall status, all containers with state/ports
  
- `GET /api/deploy-new/logs/:serviceName` - Get service logs
  - Params: `tail` (default 100 lines)
  - Returns: logs from specific container
  
- `GET /api/deploy-new/logs` - Get all service logs
  - Params: `tail` (default 100 lines)
  - Returns: aggregate logs from all containers
  
- `POST /api/deploy-new/control/:action` - Control stack operations
  - Actions: `start`, `stop`, `restart`, `down`, `pull`
  - Returns: operation result with stdout/stderr

**Files Modified:**
- `backend/src/routes/deploy-new.routes.ts` - Updated to use StackManager

### 5. **Enhanced Dashboard UI** ✅
Completely rebuilt the Dashboard component with professional UI/UX:

**Features:**
- **Stack Overview** - Status indicator with container count
- **Stack Controls** - Buttons for start/stop/restart/pull with loading states
- **Container Table** - Service list with:
  - Service name, container name
  - State (color-coded: green=running, red=exited, orange=starting)
  - Health status if available
  - Port mappings
  - Individual "View Logs" button per container
  
- **Logs Viewer** - Interactive log display with:
  - Terminal-style dark theme
  - Scrollable output (max 400px height)
  - Per-service or all-services view
  - Select any container to view its logs
  
- **Service Coordination Control** - Run API coordination with:
  - Results display in JSON format
  - Running state indication
  - Error handling

**Styling:**
- Professional color scheme (blue/green/red action buttons)
- Responsive two-column layout
- Status color coding (green=healthy, red=failed, orange=pending)
- Monospace font for logs (Consolas/Monaco)

**Files Modified:**
- `frontend/src/components/Dashboard.tsx` - Complete rewrite

### 6. **TypeScript Type Safety** ✅
- Added `error?` field to `CoordinationStatus` interface
- All configurations now properly typed across frontend and backend
- Type-safe API client usage throughout

**Files Modified:**
- `frontend/src/types/plexarr-config.types.ts` - Added error field to CoordinationStatus

## Architecture Flow

### Deployment Lifecycle
```
1. User fills Wizard:
   → System Config (timezone, PUID/PGID, projectFolder)
   → Storage Paths (media, downloads, config)
   → Services (enable/config/ports)
   → Review & Deploy

2. On Deploy:
   → Save config to backend database
   → Validate projectFolder exists on host
   → Generate docker-compose.yml
   → Write compose to: {projectFolder}/plexarr-stack/compose.yml
   → Create all service directories with proper permissions
   → Run: docker compose -f {COMPOSE_PATH} up -d
   
3. User navigates to Dashboard:
   → Real-time container status updates (every 10s)
   → View logs for each service
   → Control stack (start/stop/restart/pull)
   → Run service coordination
```

### File Persistence
- **Host Location**: Configurable via projectFolder (e.g., `/opt/plexarr`)
- **Inside Container**: Mounted at `/opt/plexarr` (same path for consistency)
- **Compose File**: `{projectFolder}/plexarr-stack/compose.yml`
- **Stack Data**: All config persists on host even if container restarts

### Container Management
- Docker socket mounted: `/var/run/docker.sock:/var/run/docker.sock`
- StackManager executes all docker commands in the mounted directory context
- External network `plexarr_default` created and managed by StackManager
- Proper user/group permissions set on all directories

## User Experience Improvements

### Before
- ❌ All wizard steps showed "under construction"
- ❌ No way to specify where files go on the host
- ❌ Deployment files stored in ephemeral container storage
- ❌ No visibility into container status/logs
- ❌ No way to manage running services

### After
- ✅ Complete multi-step wizard with all services working
- ✅ Project folder specified early in wizard
- ✅ Compose files persist on host (accessible via host filesystem)
- ✅ Real-time container status in Dashboard
- ✅ Per-service log viewing
- ✅ Start/stop/restart/pull controls for stack
- ✅ Color-coded health indicators
- ✅ Professional UI with responsive design

## Technical Highlights

### Dockge Pattern Integration
- **File-based stack management** - Compose files stored on host, not centralized database
- **DockerSocket mounting** - Manage containers from within a container
- **Terminal output streaming** - Real-time feedback on operations
- **Status polling** - Automatic health checks via docker compose ps
- **External network** - Managed by application, not pre-configured

### TypeScript Benefits
- Full type safety across frontend and backend
- Compile-time error detection  
- Better IDE autocomplete and refactoring
- Single source of truth for interfaces

### Multi-Stage Docker Builds
- Optimized image sizes
- Separated build and runtime dependencies
- Frontend: Node build → Nginx serving
- Backend: TypeScript build → Node runtime

## Testing Checklist

✅ Containers build successfully
✅ Both frontend and backend start without errors
✅ Frontend accessible on http://localhost:3000
✅ Backend API accessible on http://localhost:3001
✅ Wizard displays all steps (Welcome, System, Storage, Services, Review)
✅ System step includes Project Folder input
✅ Dashboard shows container status
✅ Dashboard shows control buttons
✅ Log viewing works per-service

## Next Steps / Potential Enhancements

1. **Real-time Log Streaming**
   - Use WebSocket to stream logs in real-time
   - Watch file approach for compose logs
   
2. **Docker Compose Editing**
   - Allow users to edit compose.yml directly in UI
   - YAML syntax highlighting
   - Validation before save/deploy

3. **Stack Backup/Restore**
   - Export entire stack to zip
   - Import previously exported configs
   - Version control for compose files

4. **Multi-Stack Support**
   - Support multiple stacks on same host
   - Switch between stacks in UI
   - Independent configuration per stack

5. **Advanced Monitoring**
   - Resource usage (CPU/Memory) per container
   - Uptime tracking
   - Alerts on service failure

6. **Web Terminal**
   - Direct shell access to running containers
   - Execute commands in real-time

## Files Summary

### Created
- `backend/src/services/stack-manager.service.ts` - Complete stack management

### Modified  
- `backend/src/models/config.ts` - Added projectFolder
- `backend/src/models/config.model.ts` - Added projectFolder
- `backend/src/models/config-defaults.ts` - Set default
- `backend/src/routes/deploy-new.routes.ts` - Enhanced with StackManager
- `docker-compose.yml` - Added volume mount for stacks directory
- `frontend/src/types/plexarr-config.types.ts` - Added projectFolder, error field
- `frontend/src/types/config.types.ts` - Added projectFolder
- `frontend/src/pages/WizardPage.tsx` - Added Project Folder step
- `frontend/src/components/Dashboard.tsx` - Complete rewrite with full features

## Deployment Instructions

```bash
# Build and start the stack
docker compose up -d --build

# Watch logs
docker compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001

# To deploy a stack:
# 1. Open http://localhost:3000
# 2. Fill in the wizard
# 3. Choose a projectFolder (e.g., /opt/plexarr) 
# 4. Deploy
# 5. Check http://localhost:3000/dashboard for status and logs
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Host Machine                             │
│  /opt/plexarr/                                              │
│  ├── plexarr-stack/                                         │
│  │   ├── compose.yml (generated & persisted)               │
│  │   └── [service directories]                             │
│  └── [other stacks if future multi-stack support]          │
└─────────────────────────────────────────────────────────────┘
         ▲                    │
         │ Mount              │ Mount
         │ /opt/plexarr       │ /var/run/docker.sock
         │                    ▼
         │         ┌──────────────────────┐
         │         │  PlexArr Backend     │
         │         │  (Node + Express)    │
         │         ├──────────────────────┤
         │         │ StackManager Service │
         └────────►│                      │
                   │ • Deploy stacks      │
                   │ • Get status         │
                   │ • Stream logs        │
                   │ • Control containers │
                   └──────────────────────┘
                           ▲
                           │ API
                           │
                   ┌──────────────────────┐
                   │  PlexArr Frontend    │
                   │  (React + TypeScript)│
                   ├──────────────────────┤
                   │ • Wizard UI          │
                   │ • Dashboard UI       │
                   │ • Log Viewer         │
                   │ • Control Panel      │
                   └──────────────────────┘
```

---

**Status**: ✅ Complete and Tested
**Build**: ✅ All lint/compilation errors resolved
**Deployment**: ✅ Both containers running
**Date**: 2024
