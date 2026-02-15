# PlexArr Setup Guide

Complete installation and configuration guide for PlexArr - the unified Plex media server setup tool.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Automated Setup](#automated-setup)
4. [Manual Setup](#manual-setup)
5. [Troubleshooting](#troubleshooting)
6. [Post-Installation](#post-installation)

---

## Quick Start

```bash
# Clone the repository (if not already done)
git clone https://github.com/yourusername/PlexArr.git
cd PlexArr

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check all dependencies (Node.js, npm, Docker, Docker Compose)
- ✅ Create necessary directories and networks
- ✅ Build Docker containers
- ✅ Start services
- ✅ Verify everything is working

Once complete, access the wizard at **http://localhost:3000**

---

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows (WSL2)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 20GB for applications + media

### Required Software

#### 1. Node.js & npm
```bash
# Check version
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 7.0.0 or higher

# Install via nodejs.org or package manager
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS (with Homebrew)
brew install node

# Windows
# Download from https://nodejs.org
```

#### 2. Docker & Docker Compose
```bash
# Check version
docker --version         # Should be 20.10.0 or higher
docker compose version   # Docker Compose V2 (plugin)

# Install Docker
# https://docs.docker.com/get-docker/

# Ubuntu/Debian
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# macOS (with Homebrew)
brew install --cask docker

# Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### 3. Verify Docker Daemon
```bash
# Docker daemon must be running
docker ps

# If you get "permission denied", add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## Automated Setup

### Option 1: Full Automated Setup (Recommended)

```bash
cd /path/to/PlexArr
./setup.sh
```

**What happens:**
1. **Dependency Check** (30 seconds)
   - Verifies Node.js, npm, Docker versions
   - Ensures Docker daemon is running
   - Checks Docker Compose availability

2. **Environment Setup** (1 minute)
   - Creates `/opt/plexarr` directory (or custom path)
   - Creates external Docker network
   - Sets proper permissions

3. **Dependency Installation** (2-3 minutes)
   - Installs Node.js packages

4. **Container Build** (3-5 minutes)
   - Builds backend Docker image (includes Docker CLI)
   - Builds frontend Docker image
   - Caches layers for faster rebuilds

5. **Service Start** (30 seconds)
   - Starts PlexArr backend
   - Starts PlexArr frontend
   - Verifies both are healthy

6. **Verification** (1 minute)
   - Tests health endpoints
   - Confirms Docker access in container
   - Validates network connectivity

**Total Time**: ~10-15 minutes

### Option 2: Custom Stacks Directory

```bash
# Set custom directory before running setup
STACKS_DIR=/home/myuser/media/stacks ./setup.sh

# Or edit setup.sh and change:
# STACKS_DIR="${STACKS_DIR:-/opt/plexarr}"
```

### Option 3: Step-by-Step with Progress

```bash
# Run with verbose output
bash -x ./setup.sh

# Run individual checks
./setup.sh --check-dependencies-only
./setup.sh --build-only
./setup.sh --verify-only
```

---

## Manual Setup

If you prefer to set up manually or the automated script fails:

### Step 1: Check Dependencies

```bash
# Node.js (required: 16+)
node --version

# npm (required: 7+)
npm --version

# Docker (required: 20.10+)
docker --version

# Docker Compose V2 (plugin)
docker compose version

# Verify daemon is running
docker ps
```

### Step 2: Create Directories

```bash
# Create stacks directory
mkdir -p /opt/plexarr
chown $USER:$USER /opt/plexarr

# Create data directory for PlexArr config
mkdir -p /opt/plexarr/data
```

### Step 3: Create Docker Network

```bash
# Create external network for containers
docker network create plexarr_default
```

### Step 4: Install Dependencies

```bash
cd /path/to/PlexArr

# Install Node packages
npm install

# Install frontend dependencies (if separate)
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 5: Build Docker Images

```bash
cd /path/to/PlexArr

# Build containers
docker compose build

# Or rebuild with no cache
docker compose build --no-cache
```

### Step 6: Start Services

```bash
# Start in background
docker compose up -d

# Or with logs visible
docker compose up

# Stop with Ctrl+C
```

### Step 7: Verify

```bash
# Check running containers
docker compose ps

# Check backend health
curl http://localhost:3001/health

# View backend logs
docker compose logs plexarr-backend

# View frontend logs
docker compose logs plexarr-frontend
```

---

## First Time Wizard

Once services are running, access the setup wizard:

### 1. **Welcome Step**
- Overview of PlexArr
- Information about what will be configured

### 2. **System Configuration**
- **Timezone**: Your local timezone (e.g., America/Denver)
- **PUID**: User ID for container permissions
  ```bash
  # Find your PUID/PGID
  id -u    # Your user ID
  id -g    # Your group ID
  ```
- **PGID**: Group ID for container permissions
- **Project Folder**: Where to store compose files on host
  - Default: `/opt/plexarr`
  - Change if you want different location
  - Must be writable by your user

### 3. **Storage Paths**
- **Media Root**: `/path/to/media` (movies, TV, music)
- **Downloads**: `/path/to/downloads`
- **Config**: `/opt/plexarr/config`
- Optional overrides for each media type

### 4. **Services**
- Enable/Disable services
- Configure ports for each
- Services include:
  - **Plex**: Media server
  - **Radarr**: Movie management
  - **Sonarr**: TV show management
  - **Lidarr**: Music management
  - **Prowlarr**: Indexer management
  - **Overseerr**: Request management
  - **Maintainerr**: Container management
  - **NZBGet**: Usenet downloader
  - **Nginx Proxy Manager**: (Optional) Reverse proxy
  - **WireGuard**: (Optional) VPN

### 5. **Review & Deploy**
- Review all configured settings
- Click "Deploy Stack"
- Wizard will:
  1. Save configuration
  2. Generate docker-compose.yml
  3. Write to `/opt/plexarr/plexarr-stack/compose.yml`
  4. Deploy services via Docker Compose
  5. Redirect to dashboard

---

## Configuration Files

### Generated Files

After wizard completes, the following files are created:

```
/opt/plexarr/
├── plexarr-stack/
│   ├── compose.yml           # Generated docker-compose (persisted on host!)
│   ├── .env                  # Environment variables
│   └── [service directories] # Config folders for all services
└── data/
    └── config.json           # PlexArr configuration
```

### Important Locations

```bash
# Wizard/Dashboard UI
http://localhost:3000

# Backend API
http://localhost:3001

# API Endpoints
GET    /health                           # Health check
GET    /api/config-new                   # Get current config
PUT    /api/config-new                   # Save config
POST   /api/config-new/validate          # Validate config
POST   /api/config-new/check-path        # Check path exists

GET    /api/deploy-new/status            # Container status
POST   /api/deploy-new/execute           # Deploy stack
POST   /api/deploy-new/coordinate        # Coordinate services
GET    /api/deploy-new/logs              # Get all logs
GET    /api/deploy-new/logs/:service     # Get service logs
POST   /api/deploy-new/control/:action   # start/stop/restart
```

---

## Dashboard

Once deployed, use the Dashboard to:

### Monitor Stack
- View container status
- See which services are running/stopped
- Check health indicators

### View Logs
- Select any service to view its logs
- View aggregate logs from all containers
- Follow logs in real-time (when implemented)

### Control Stack
- **Start**: Start all containers
- **Stop**: Stop all containers gracefully
- **Restart**: Recycle all containers
- **Pull**: Update Docker images to latest
- **Down**: Tear down and remove containers

### Coordinate Services
- Automatically exchange API keys between services
- Connect Radarr, Sonarr, Prowlarr, Overseerr
- Set up media automation workflows

---

## Troubleshooting

### Docker Command Not Found
**Error**: `docker: command not found`
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Permission Denied
**Error**: `permission denied while trying to connect to Docker daemon`
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Log out and back in for changes to take effect
```

### Docker Compose Not Found
**Error**: `docker: 'compose' is not a command`
```bash
# Ensure Docker Compose V2 is installed
docker compose version

# If not available, install it
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Containers Won't Start
```bash
# Check logs
docker compose logs plexarr-backend
docker compose logs plexarr-frontend

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port Already in Use
**Error**: `bind: address already in use`
```bash
# Find process using port
sudo lsof -i :3000  # Frontend
sudo lsof -i :3001  # Backend

# Kill the process
sudo kill <PID>

# Or change ports in docker-compose.yml
# Edit the ports section and restart
docker compose down
docker compose up -d
```

### Network Creation Failed
**Error**: `Error response from daemon: could not find an available, non-overlapping IPv4 address pool`
```bash
# Remove conflicting networks
docker network ls
docker network rm <network_name>

# Recreate
docker network create plexarr_default
```

### Insufficient Disk Space
**Solution**: Clean up Docker storage
```bash
# Remove unused images/containers/networks
docker system prune -a

# Check disk usage
docker system df
```

### Services Not Communicating
**Error**: Services can't connect to each other
```bash
# Verify network
docker network inspect plexarr_default

# Check containers are on the network
docker inspect plexarr-backend | grep Networks
docker inspect plexarr-frontend | grep Networks

# If not on network, restart:
docker compose down
docker compose up -d
```

---

## Post-Installation

### Access Services

```bash
# PlexArr Dashboard
http://localhost:3000

# Backend API
http://localhost:3001

# Deployed Services (examples)
Plex:           http://localhost:32400/web
Radarr:         http://localhost:7878
Sonarr:         http://localhost:8989
Prowlarr:       http://localhost:9696
Overseerr:      http://localhost:5055
Maintainerr:    http://localhost:6246
```

### Useful Commands

```bash
# View all containers
docker compose ps

# View logs
docker compose logs -f                    # All services
docker compose logs -f plexarr-backend    # Specific service

# Stop services
docker compose down

# Restart services
docker compose restart

# Rebuild if code changed
docker compose up -d --build

# Enter container shell
docker compose exec plexarr-backend sh
docker compose exec plexarr-frontend sh

# Check resource usage
docker stats

# Cleanup old images/containers
docker system prune
```

### Backup Configuration

```bash
# Backup the entire stack
tar -czf plexarr-backup-$(date +%Y%m%d).tar.gz /opt/plexarr/

# Backup PlexArr config only
cp /opt/plexarr/data/config.json /opt/plexarr/backups/config-$(date +%Y%m%d).json
```

### Update Services

```bash
# Pull latest Docker images
docker compose pull

# Rebuild and restart
docker compose up -d --build

# Or just restart without rebuilding
docker compose restart
```

---

## Getting Help

### Logs
```bash
# Full logs with timestamps
docker compose logs --timestamps --follow

# Last 50 lines
docker compose logs --tail 50

# Specific service only
docker compose logs -f plexarr-backend
```

### System Info
```bash
# Docker version
docker version

# Docker info
docker info

# Compose version  
docker compose version

# Check network
docker network ls
docker network inspect plexarr_default
```

### Common Issues
- **Can't find docker command**: Docker not installed or not in PATH
- **Permission denied**: User not in docker group
- **Port in use**: Another service using 3000 or 3001
- **Network error**: External network not created
- **Services not running**: Check `docker compose logs`

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Your Host Machine                 │
│  /opt/plexarr/                              │
│  ├── plexarr-stack/compose.yml (persisted) │
│  └── [service config directories]          │
└─────────────────────────────────────────────┘
         ↓ Mounted Volumes
┌─────────────────────────────────────────────┐
│        Docker Containers Network            │
│  plexarr_default (external bridge network)  │
└─────────────────────────────────────────────┘
    ↓                           ↓
┌─────────────┐        ┌──────────────────┐
│  Backend    │        │    Frontend      │
│  :3001      │───────→│    :3000         │
│  Node.js    │        │    Nginx/React   │
├─────────────┤        └──────────────────┘
│ Stack Mgr   │
│ Docker CLI  │
│ Services    │
└─────────────┘
```

---

## Next Steps

1. ✅ Run `./setup.sh` and complete the wizard
2. ✅ Access dashboard at http://localhost:3000
3. ✅ Configure your media directories
4. ✅ Enable desired services
5. ✅ Deploy the stack
6. ✅ Configure service integrations
7. ✅ Start adding media
8. ✅ Set up automation rules

---

**Questions?** Check the logs with `docker compose logs -f` or review the troubleshooting section above.
