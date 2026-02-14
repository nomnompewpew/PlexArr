# PlexArr Quick Start Guide

## Overview

PlexArr simplifies the setup of a complete Plex media server stack with automatic API key coordination between all services.

## What You'll Get

After completing the setup, you'll have:

- **Plex Media Server** - Your central media library
- **Radarr** - Automated movie downloads
- **Sonarr** - Automated TV show downloads
- **Lidarr** - Automated music downloads
- **Prowlarr** - Unified indexer management
- **Overseerr** - User-friendly request system
- **Maintainerr** - Automated collection management
- **NZBGet** - Usenet download client
- **Optional**: Nginx Proxy Manager, WireGuard VPN

All services are automatically connected and configured to work together!

## Prerequisites

1. **Linux Server** (Ubuntu, Debian, etc.) or WSL2 on Windows
2. **Docker** and **Docker Compose** installed
3. **Storage Space** - At least 100GB recommended
4. **Network Access** - Ability to configure port forwarding on your router

### Install Docker (if needed)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/nomnompewpew/PlexArr.git
cd PlexArr
```

### Step 2: Create Docker Networks

```bash
docker network create adguard_default
docker network create stacks_default
```

### Step 3: Start PlexArr

```bash
docker-compose up -d
```

Wait a minute for the containers to start.

### Step 4: Access Setup Wizard

Open your browser and navigate to:

```
http://localhost:3000
```

Or if accessing remotely:

```
http://YOUR_SERVER_IP:3000
```

### Step 5: Complete the Wizard

The wizard will guide you through:

#### 1. Welcome Screen
- Overview of PlexArr and what it does

#### 2. System Configuration
- **Timezone**: Your local timezone (e.g., `America/New_York`)
- **PUID**: Your user ID - find with `id -u` command
- **PGID**: Your group ID - find with `id -g` command

#### 3. Network Configuration (Optional)
- **Public IP**: Your external IP address
- **Public Domain**: If you have a domain name

**Port Forwarding Help**:
The wizard provides guidance on configuring your router. Typically you need to forward:
- Port 32400 (Plex)
- Port 80 (HTTP)
- Port 443 (HTTPS)

#### 4. Select Services
Choose which services you want to enable. Recommended for beginners:
- ✅ Plex
- ✅ Radarr
- ✅ Sonarr
- ✅ Prowlarr
- ✅ Overseerr
- ✅ Maintainerr
- ✅ NZBGet

#### 5. Review & Deploy
- Review your configuration
- Click "Deploy Now" to generate the docker-compose file

### Step 6: Deploy Your Stack

After the wizard generates your configuration:

```bash
# Navigate to the generated configuration
cd PlexArr

# Deploy the stack
docker-compose -f generated-config/docker-compose.yml up -d
```

### Step 7: Wait for Services to Start

Give the services 2-3 minutes to fully initialize.

```bash
# Check status
docker-compose -f generated-config/docker-compose.yml ps
```

### Step 8: Access Your Services

All services are now available:

| Service | URL | Purpose |
|---------|-----|---------|
| Plex | http://localhost:32400/web | Media streaming |
| Radarr | http://localhost:7878 | Movie management |
| Sonarr | http://localhost:8989 | TV show management |
| Prowlarr | http://localhost:9696 | Indexer management |
| Lidarr | http://localhost:8686 | Music management |
| Overseerr | http://localhost:5055 | Media requests |
| Maintainerr | http://localhost:6246 | Collection management |
| NZBGet | http://localhost:6789 | Downloads |

Replace `localhost` with your server's IP if accessing remotely.

## Initial Configuration

### 1. Configure Plex (First!)

1. Go to http://localhost:32400/web
2. Sign in with your Plex account
3. Set up your libraries:
   - Movies → Point to your movies directory
   - TV Shows → Point to your TV directory
   - Music → Point to your music directory

### 2. Configure Prowlarr

1. Go to http://localhost:9696
2. Add indexers:
   - Click "Indexers" → "Add Indexer"
   - Search for your preferred indexers (e.g., NZBGeek, DrunkenSlug for Usenet)
   - Or add Torrent indexers (The Pirate Bay, 1337x, etc.)
3. Indexers will automatically sync to Radarr, Sonarr, and Lidarr!

### 3. Configure NZBGet (If Using Usenet)

1. Go to http://localhost:6789
2. Default credentials: `nzbget` / `tegbzn6789`
3. Go to Settings:
   - Add your Usenet server details
   - Save changes

### 4. Configure Overseerr

1. Go to http://localhost:5055
2. Sign in with Plex
3. Overseerr will automatically connect to:
   - Your Plex server
   - Radarr (for movies)
   - Sonarr (for TV shows)

### 5. Configure Maintainerr

1. Go to http://localhost:6246
2. Connect to Plex
3. Create collections and rules for automatic library management

## Automatic API Coordination

**PlexArr automatically handles all service connections!**

After deployment, the system automatically:
- ✅ Connects Prowlarr to all *arr apps
- ✅ Adds NZBGet to Radarr and Sonarr
- ✅ Configures Overseerr with Plex and *arr apps
- ✅ Sets up Maintainerr with Plex

You don't need to manually configure API keys or connections!

## Using Your Media Server

### Requesting Media

1. Open Overseerr (http://localhost:5055)
2. Search for a movie or TV show
3. Click "Request"
4. The request is automatically sent to Radarr or Sonarr
5. The *arr app searches for the media via Prowlarr
6. NZBGet downloads it
7. It's automatically organized and added to Plex!

### Managing Collections

1. Open Maintainerr (http://localhost:6246)
2. Create rules for collections (e.g., "Marvel Movies", "4K Content")
3. Collections are automatically created in Plex

## External Access

To access your server from outside your home network:

### Option 1: Port Forwarding

1. Configure port forwarding on your router:
   - Forward port 32400 to your server
2. Access Plex at: `http://YOUR_PUBLIC_IP:32400/web`

### Option 2: WireGuard VPN (If Enabled)

1. Access WireGuard UI: http://localhost:51821
2. Create a VPN profile
3. Connect to VPN from anywhere
4. Access all services as if you're home!

### Option 3: Nginx Proxy Manager (If Enabled)

1. Access Nginx: http://localhost:81
2. Default credentials: `admin@example.com` / `changeme`
3. Set up reverse proxy for each service
4. Add SSL certificates via Let's Encrypt
5. Access services at: `https://plex.yourdomain.com`

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose -f generated-config/docker-compose.yml logs [service-name]

# Restart a service
docker-compose -f generated-config/docker-compose.yml restart [service-name]
```

### Permission Issues

```bash
# Fix ownership of media directories
sudo chown -R $(id -u):$(id -g) /path/to/media
```

### Can't Connect to Services

1. Ensure all containers are running:
   ```bash
   docker ps
   ```

2. Check if ports are listening:
   ```bash
   sudo netstat -tlnp | grep -E '(7878|8989|9696|32400)'
   ```

3. Verify firewall allows the ports:
   ```bash
   sudo ufw allow 32400/tcp
   sudo ufw allow 7878/tcp
   sudo ufw allow 8989/tcp
   ```

### API Coordination Failed

The system runs automatic coordination after deployment. If it fails:

```bash
# Manually trigger coordination
curl -X POST http://localhost:3001/api/deploy/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "services": {
      "radarr": {"url": "http://radarr:7878", "apiKey": "YOUR_KEY"},
      "sonarr": {"url": "http://sonarr:8989", "apiKey": "YOUR_KEY"},
      "prowlarr": {"url": "http://prowlarr:9696", "apiKey": "YOUR_KEY"}
    }
  }'
```

## Updating

To update PlexArr:

```bash
cd PlexArr
git pull
docker-compose pull
docker-compose up -d
```

To update your media stack:

```bash
cd PlexArr
docker-compose -f generated-config/docker-compose.yml pull
docker-compose -f generated-config/docker-compose.yml up -d
```

## Getting Help

- **GitHub Issues**: https://github.com/nomnompewpew/PlexArr/issues
- **Check Logs**: `docker-compose logs`
- **Community Forums**: r/selfhosted, r/plex

## Next Steps

1. Add more indexers in Prowlarr
2. Set up quality profiles in Radarr/Sonarr
3. Create custom collections in Maintainerr
4. Share your Plex server with friends/family
5. Set up automated backups

Enjoy your automated media server! 🎉🍿
