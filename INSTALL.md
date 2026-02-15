# PlexArr Installation Guide

Welcome to PlexArr! This guide will help you get PlexArr up and running on your system. We provide automated installation scripts for both Linux and Windows to make the process as simple as possible.

## System Requirements

### Minimum Requirements
- **CPU**: Dual-core processor (Intel/AMD)
- **RAM**: 2GB minimum (4GB+ recommended)
- **Disk Space**: 10GB+ for application and data
- **Internet**: Stable connection for downloading dependencies

### Operating System Support

#### Linux
- **Ubuntu** 20.04 LTS or newer
- **Debian** 11 (Bullseye) or newer
- **CentOS/RHEL** 8 or newer
- **Arch Linux** (rolling release)

#### Windows
- **Windows 10** (version 20H2 or newer) or **Windows 11**
- **Virtualization enabled** in BIOS (for Docker)
- **At least 4GB RAM available** for Docker

---

## Quick Start (Automated Installation)

### Option 1A: Linux Installation (Easiest)

**Prerequisites**: None - the script will install everything!

```bash
# Download the installer
wget https://github.com/neckbeard/PlexArr/raw/main/install.sh
chmod +x install.sh

# Run the installer
./install.sh
```

**What the script does:**
- ✓ Detects your Linux distribution (Ubuntu/Debian, CentOS/Fedora, Arch)
- ✓ Checks for required software (Node.js, Docker, Docker Compose, Git)
- ✓ Installs missing dependencies automatically
- ✓ Configures Docker permissions for your user
- ✓ Clones the PlexArr repository
- ✓ Builds the application
- ✓ Starts all services using Docker Compose
- ✓ Open PlexArr in your browser automatically

**Installation time**: ~5-15 minutes (depending on your internet speed)

---

### Option 1B: Windows Installation

**Prerequisites**:
- Administrator access
- PowerShell (comes with Windows)

**Steps:**

1. **Open PowerShell as Administrator**
   - Right-click the PowerShell icon or search for "PowerShell"
   - Select "Run as administrator"
   - Click "Yes" if prompted

2. **Allow script execution** (one-time only)
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   - You'll be asked to confirm - type `Y` and press Enter

3. **Download and run the installer**
   ```powershell
   # Download the installer
   curl -OutFile install.ps1 https://github.com/neckbeard/PlexArr/raw/main/install.ps1
   
   # Run it
   .\install.ps1
   ```

**What the script does:**
- ✓ Detects Windows version and architecture
- ✓ Checks for required software (Node.js, Docker Desktop, Git)
- ✓ Installs missing dependencies automatically
- ✓ Clones the PlexArr repository
- ✓ Builds the application  
- ✓ Starts all services using Docker Compose
- ✓ Opens PlexArr in your browser automatically

**Installation time**: ~10-20 minutes (includes Docker Desktop download)

**Note**: Docker Desktop requires virtualization to be enabled in your BIOS. If installation fails, you may need to restart your computer and enable virtualization in BIOS settings.

---

## Manual Installation

If you prefer to set up PlexArr manually, or if the automated scripts don't work for your setup, follow these steps:

### Prerequisites
Before starting, ensure these are installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker** - [Installation guide](https://docs.docker.com/engine/install/)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Git** - [Download here](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/neckbeard/PlexArr.git
cd PlexArr
```

### Step 2: Install Dependencies

```bash
# Install npm dependencies (runs for both frontend and backend)
npm install
```

### Step 3: Build the Frontend

```bash
cd frontend
npm run build
cd ..
```

### Step 4: Prepare Docker

```bash
# Make sure Docker daemon is running
docker ps
```

If Docker isn't running:
- **Linux**: `sudo systemctl start docker`
- **Windows**: Open Docker Desktop application
- **macOS**: Open Docker Desktop application

### Step 5: Start PlexArr

```bash
docker compose up -d
```

This will:
- Build Docker images for frontend and backend
- Start PostgreSQL database
- Start the backend API server
- Start the frontend web server

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Step 6: Open PlexArr

Open your browser and navigate to: **http://localhost:3000**

You should see the Deployment Wizard. Proceed to the next section to configure your services.

---

## Post-Installation Setup

### First-Time Configuration

After PlexArr starts, you'll see the **Deployment Wizard**. This is where you:

1. **Select which services to enable** (Plex, Radarr, Sonarr, etc.)
2. **Configure directory paths** where media will be stored
3. **Set optional features** like timezone and download directories

**Pro tip**: The wizard color-codes all fields:
- 🔵 **Blue** = You must choose this value
- ⚙️ **Gray** = System defaults (don't change unless you know why)
- ⚠️ **Orange** = Advanced - only customize if needed
- 📌 **Purple** = Optional - only needed for specific use cases
- 🔴 **Red** = Important warnings

### Guided Service Setup

After deployment, PlexArr automatically launches the **Post-Deployment Setup Wizard**. This walks you through:

1. **Setting up each service** in the correct order
2. **Providing copy-paste configuration values** (no manual typing!)
3. **Retrieving default credentials** for download clients
4. **Validating everything works** before moving to the next service

You'll see:
- ✓ Checkmarks when each service is ready
- 📊 Progress bar showing overall completion
- 🔗 Direct links to service web interfaces
- 📋 Pre-filled configuration values you can copy

---

## Accessing PlexArr

### Web Interface

Once running, PlexArr is available at:
```
http://localhost:3000
```

### From Other Computers

To access PlexArr from another computer on your network:

1. Find your computer's IP address:
   - **Linux**: `hostname -I`
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **macOS**: System Preferences → Network

2. Visit: `http://<YOUR_IP>:3000`

Example: `http://192.168.1.100:3000`

---

## Managing PlexArr

### Start PlexArr

```bash
cd /path/to/PlexArr
docker compose up -d
```

### Stop PlexArr

```bash
cd /path/to/PlexArr
docker compose down
```

### View Logs

```bash
cd /path/to/PlexArr
docker compose logs -f
```

### View Specific Service Logs

```bash
docker compose logs -f backend    # Backend API
docker compose logs -f frontend   # Frontend UI
docker compose logs -f postgres   # Database
```

### Restart a Specific Service

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart <service-name>
```

---

## Troubleshooting

### PlexArr Won't Start

**Check Docker**
```bash
docker ps                    # Should show running containers
docker compose logs backend  # Check for error messages
```

**Check Ports**
```bash
# Linux/macOS
lsof -i :3000  # Check if port 3000 is in use
lsof -i :3001  # Check if port 3001 is in use

# Windows (PowerShell as admin)
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

If ports are in use, either:
- Stop whatever is using them, or
- Modify `docker-compose.yml` to use different ports

**Restart Everything**
```bash
docker compose down
docker compose up -d
```

### Dashboard Shows White Screen

This means the frontend can't reach the backend API.

**Check backend is running:**
```bash
curl http://localhost:3001/api/health
```

Should return JSON response like: `{"status":"ok"}`

**If it fails:**
- Check logs: `docker compose logs backend`
- Restart backend: `docker compose restart backend`
- Wait 10 seconds and refresh the page

### Can't Connect to Service (Plex, Radarr, etc.)

1. Check the service is running:
   ```bash
   docker compose ps
   ```
   All services should show "running" status

2. Check service logs:
   ```bash
   docker compose logs plex
   docker compose logs radarr
   ```

3. Check if service port is accessible:
   ```bash
   curl http://localhost:<service-port>
   ```

4. Restart the service:
   ```bash
   docker compose restart <service-name>
   ```

### Installation Script Fails

**Linux users:**
- Make sure script has execute permission: `chmod +x install.sh`
- Run with bash: `bash install.sh`
- Check internet connection
- Try manual installation steps above

**Windows users:**
- Run PowerShell **as Administrator**
- Check execution policy: `Get-ExecutionPolicy`
- Should be "RemoteSigned" or "Unrestricted"
- Wait for Docker Desktop to fully start before running script

### Docker Daemon Won't Start (Windows)

- Open Docker Desktop application manually
- Wait 30 seconds for it to fully initialize
- Try running PlexArr again

### Permission Denied Errors (Linux)

The installer should set up Docker permissions automatically. If you still get permission errors:

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Apply new group membership
newgrp docker

# Verify it works
docker ps
```

You may need to log out and log back in for changes to take effect.

---

## Advanced Configuration

### Custom Install Location

By default:
- **Linux/macOS**: `~/PlexArr`
- **Windows**: `%USERPROFILE%\PlexArr`

To install elsewhere, clone manually to your preferred location:
```bash
git clone https://github.com/neckbeard/PlexArr.git /path/to/custom/location
cd /path/to/custom/location
```

Then continue with manual installation steps.

### Custom Port Configuration

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3000:3000"  # Change first number to 8000 for port 8000
      
  backend:
    ports:
      - "3001:3001"  # Change first number to 8001 for port 8001
```

Then restart: `docker compose up -d`

### Behind a Reverse Proxy (nginx, Traefik)

1. Modify `docker-compose.yml` to use an internal network
2. Configure your reverse proxy to forward requests to `backend:3001` and `frontend:3000`
3. Ensure authentication is configured at the proxy level

---

## Performance Tips

### Recommended Settings

**For media libraries under 1,000 items:**
- 2GB RAM minimum
- Any modern processor

**For media libraries 1,000-10,000 items:**
- 4GB RAM
- Dual-core processor

**For media libraries 10,000+ items:**
- 8GB RAM
- Quad-core processor
- SSD for database storage

### Database Optimization

PlexArr uses PostgreSQL. To optimize performance:

1. Ensure PostgreSQL container has enough resources
2. Regular backups: `docker compose exec postgres pg_dump -U plexarr plexarr > backup.sql`
3. Monitor disk space: Download clients will consume significant space

### Network Optimization

For best performance:
- Connect via Ethernet (not WiFi)
- Ensure Docker networking is not experiencing congestion
- Consider running PlexArr on a dedicated machine or VM

---

## Upgrading PlexArr

To update to the latest version:

```bash
cd /path/to/PlexArr
git pull origin main
docker compose up -d --build
```

This will:
1. Pull the latest code
2. Rebuild Docker images
3. Start updated services
4. Preserve your configuration and data

---

## Uninstalling PlexArr

To completely remove PlexArr:

```bash
cd /path/to/PlexArr

# Stop services and remove containers
docker compose down -v

# Optional: Remove the installation directory
cd ..
rm -rf PlexArr
```

**Note**: The `-v` flag removes all Docker volumes (including database). Omit it if you want to preserve data.

---

## Getting Help

If you encounter issues:

1. **Check the troubleshooting section** above
2. **View logs** for error messages: `docker compose logs`
3. **Open an issue** on GitHub: https://github.com/neckbeard/PlexArr/issues
4. **Check documentation**: https://github.com/neckbeard/PlexArr/blob/main/README.md

When reporting issues, include:
- Operating system and version
- Output of `docker compose logs` (last 50 lines)
- Steps to reproduce the issue
- Screenshot if GUI-related

---

## Security Considerations

### Default Credentials

PlexArr uses default credentials for initial setup. **Change them immediately**:

- **Backend API**: Check environment variables in `docker-compose.yml`
- **Database**: Defaults are set in `docker-compose.yml` (change before first run)
- **Services**: Each integrated service (Plex, Radarr, etc.) has its own credentials

### Network Security

- **Local network only**: By default, PlexArr is only accessible on your local network
- **Remote access**: Use a reverse proxy with authentication (nginx, Traefik, Authentik)
- **HTTPS**: Recommended for remote access (configure at reverse proxy level)

### Backup Your Configuration

Before modifying services, backup your configuration:

```bash
docker compose exec postgres pg_dump -U plexarr plexarr > backup-$(date +%Y%m%d).sql
```

---

## Next Steps

1. ✅ Install PlexArr using the appropriate script for your OS
2. ✅ Open http://localhost:3000
3. ✅ Run the Deployment Wizard to select your services
4. ✅ Follow the Post-Deployment Setup guide
5. ✅ Start enjoying your unified media management!

For more information, see:
- [README.md](README.md) - Project overview and features
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide

---

**Happy organizing!** 🎬📺🎵

Last updated: 2024
