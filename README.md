# PlexArr

A unified Plex and Arr management solution that simplifies the setup and configuration of your media server stack.

## 🎯 Overview

PlexArr unifies the disjointed multiple docker run setup that requires each API key to be manually connected between containers for a Plex media server. Instead of manually configuring each service and connecting them together, PlexArr provides:

- **🆕 Cross-Platform Installer**: One-click desktop installer for Windows, macOS, and Linux that handles Docker, WSL2, and all dependencies automatically
- **Setup Wizard**: User-friendly interface that guides you through configuration
- **Automatic API Coordination**: Services are automatically connected and configured
- **AI-Powered Configuration**: Optional AI agent for intelligent setup recommendations (Gemini, OpenAI, Claude)
- **Post-Deployment Wizard**: Automated service configuration via APIs after containers are running
- **Unified Management**: Single interface for managing all your media services
- **Network Configuration Help**: Guidance for router/firewall setup
- **Low Configuration**: Predefined sensible defaults for quick setup

See the [ROADMAP.md](ROADMAP.md) for planned work and in-progress areas.

## 🆕 New: Cross-Platform Installer

We've added a **Tauri-based desktop installer** that makes PlexArr installation as simple as double-clicking an app:

✨ **Key Features:**
- Download-on-demand Docker and WSL2 installation
- Automatic prerequisite checking and installation
- State persistence (resume after reboot or re-login)
- Smart fallback to manual instructions with official links
- Works on Windows 10/11, macOS 10.15+, and all major Linux distributions

📖 **Learn More:** [Complete Installer Guide](INSTALLER_GUIDE.md)

## 📦 Included Services

PlexArr manages and coordinates the following services:

### Core Media Services
- **Plex Media Server** - Stream your media library
- **Radarr** - Movie collection manager
- **Sonarr** - TV show collection manager
- **Lidarr** - Music collection manager
- **Prowlarr** - Indexer manager for all *arr apps

### Download Clients
- **NZBGet (Media)** - Usenet downloads for movies & TV
- **NZBGet (Music)** - Separate Usenet downloads for music (optional)
- **qBittorrent** - BitTorrent download client (optional)
- **MeTube** - YouTube and video downloader (optional)

### Supporting Services
- **Overseerr** - Media request management
- **Maintainerr** - Collection and category management for Plex
- **Nginx Proxy Manager** - Reverse proxy with SSL support (optional)
- **WireGuard** - VPN for secure remote access (optional)

### AI & Automation
- **AI Agent** - Automated configuration assistance using Gemini, OpenAI, or Claude (optional)

## 🚀 Quick Start

### Installation Methods

#### Option 1: Cross-Platform Installer (Recommended) 🆕

The easiest way to install PlexArr is using our new cross-platform installer that handles **everything** for you:

**Features:**
- 🎯 **One-Click Install**: Double-click and go!
- 📦 **Auto-Downloads Dependencies**: Installs Docker, WSL2 (Windows), and PlexArr
- 🔄 **Resume After Reboot**: State-saving handles reboots and re-logins
- 🛠️ **Smart Fallback**: Manual instructions if auto-install fails
- ✅ **Works Everywhere**: Windows, macOS, and Linux

**Downloads:**
- [Windows Installer](https://github.com/nomnompewpew/PlexArr/releases) (.exe)
- [macOS Installer](https://github.com/nomnompewpew/PlexArr/releases) (.dmg)
- [Linux Installer](https://github.com/nomnompewpew/PlexArr/releases) (.AppImage)

**See:** [Complete Installer Guide](INSTALLER_GUIDE.md)

---

#### Option 2: Automated Setup Script

If you already have Docker installed and prefer a script-based approach:

**Prerequisites:**
- Docker and Docker Compose installed
- Node.js 16+ and npm 7+
- At least 4GB RAM
- Storage space for media files
- Linux host (or WSL2 on Windows)

**Installation:**

```bash
git clone https://github.com/nomnompewpew/PlexArr.git
cd PlexArr

# Run the setup script (handles everything)
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check all dependencies
- ✅ Create necessary directories and networks
- ✅ Build Docker containers (with Docker CLI included!)
- ✅ Start services
- ✅ Verify everything works

**Time: ~10-15 minutes**

Once complete, open **http://localhost:3000** to start the wizard!

---

#### Option 3: Manual Installation

For detailed manual setup instructions, see [SETUP.md](SETUP.md)

```bash
git clone https://github.com/nomnompewpew/PlexArr.git
cd PlexArr

# Manual steps...
npm install
docker network create plexarr_default
docker compose build
docker compose up -d
```
   ```

2. **Start PlexArr**
   ```bash
   docker-compose up -d
   ```

3. **Open the Setup Wizard**
   
   Navigate to `http://localhost:3000` in your web browser

4. **Follow the Wizard**
   
   The wizard will guide you through:
   - System configuration (timezone, user permissions)
   - Network setup (external access, port forwarding)
   - Service selection
   - Path configuration
   - Final deployment

5. **Deploy Your Stack**
   
   After completing the wizard, deploy with:
   ```bash
   docker-compose -f generated-config/docker-compose.yml up -d
   ```

## 🔧 Configuration

### System Requirements

The wizard will ask for:

- **PUID/PGID**: Your user and group IDs (find with `id -u` and `id -g`)
- **Timezone**: Your local timezone (e.g., `America/New_York`)
- **Storage Paths**: Where to store media and downloads

### Network Configuration

For external access, you'll need to configure:

1. **Port Forwarding** on your router:
   - Plex: Port 32400 (TCP)
   - HTTP: Port 80 (TCP) - if using Nginx
   - HTTPS: Port 443 (TCP) - if using Nginx  
   - WireGuard: Port 51820 (UDP) - if enabled

2. **Docker Networks**: PlexArr uses `plexarr_default` for container communication

### Service Ports

| Service | Default Port | Access URL |
|---------|-------------|------------|
| PlexArr Dashboard | 3000 | http://localhost:3000 |
| PlexArr API | 3001 | http://localhost:3001 |
| Plex | 32400 | http://localhost:32400/web |
| Radarr | 7878 | http://localhost:7878 |
| Sonarr | 8989 | http://localhost:8989 |
| Prowlarr | 9696 | http://localhost:9696 |
| Lidarr | 8686 | http://localhost:8686 |
| Overseerr | 5055 | http://localhost:5055 |
| Maintainerr | 6246 | http://localhost:6246 |
| NZBGet (Media) | 6789 | http://localhost:6789 |
| NZBGet (Music) | 6790 | http://localhost:6790 |
| qBittorrent | 8080 | http://localhost:8080 |
| MeTube | 8081 | http://localhost:8081 |
| Nginx Proxy Manager | 81 | http://localhost:81 |
| WireGuard | 51821 | http://localhost:51821 |

## 🔗 Automatic API Coordination

After deployment, PlexArr automatically:

1. **Connects Prowlarr to all *arr apps** - Indexers are shared automatically
2. **Adds download clients** - NZBGet is configured in Radarr, Sonarr, and Lidarr
3. **Configures Overseerr** - Connects to Plex, Radarr, and Sonarr
4. **Sets up Maintainerr** - Connects to Plex for collection management

All services communicate using Docker container names (e.g., `http://radarr:7878`), making the setup reliable and portable.

## 🤖 AI Agent Assistant (Optional)

PlexArr includes an optional AI agent that helps with configuration and optimization:

### Features
- **Configuration Analysis**: Get intelligent recommendations for your setup
- **Indexer Suggestions**: Personalized indexer recommendations based on your region
- **Quality Profiles**: Optimized quality settings for Radarr, Sonarr, and Lidarr
- **Troubleshooting**: AI-powered diagnosis of connection issues

### Supported Providers
- **Google Gemini** (Recommended - Free tier available)
- **OpenAI GPT-4** (Most comprehensive)
- **Anthropic Claude** (Excellent at troubleshooting)

### Setup
1. Enable "AI Agent Assistant" in the setup wizard
2. Select your preferred AI provider
3. Enter your API key (get free key at https://makersuite.google.com/app/apikey for Gemini)
4. Optionally specify a custom model

See [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) for detailed documentation.

## 📁 Directory Structure

```
PlexArr/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── models/      # Data models
│   └── templates/       # Docker compose template
├── frontend/            # React web UI
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       └── services/    # API client
├── docker-compose.yml   # PlexArr itself
└── generated-config/    # Generated stack config
```

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

The backend API runs on port 3001.

### Frontend Development

```bash
cd frontend
npm install
npm start
```

The frontend runs on port 3000 and proxies API requests to the backend.

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🔒 Security Considerations

- API keys are stored securely in a SQLite database
- WireGuard passwords are bcrypt hashed
- Services communicate on isolated Docker networks
- Configure firewall rules appropriately for external access
- Use Nginx Proxy Manager for SSL/HTTPS with Let's Encrypt

## 📖 Usage Guide

### First Time Setup

1. **Access the wizard** at `http://localhost:3000`
2. **System Configuration**: Enter your timezone and user IDs
3. **Network Setup**: Configure external access (optional)
4. **Select Services**: Choose which services to enable
5. **Review & Deploy**: Check your configuration and deploy

### Post-Deployment

1. **Wait 2-3 minutes** for all services to start
2. **Access Plex**: http://localhost:32400/web - Complete Plex setup
3. **Access Prowlarr**: http://localhost:9696 - Add indexers
4. **Access Overseerr**: http://localhost:5055 - Complete authentication
5. **Access Maintainerr**: http://localhost:6246 - Connect to Plex

The services will be automatically connected by the API coordination service.

### Adding Indexers

1. Open Prowlarr (http://localhost:9696)
2. Go to Indexers → Add Indexer
3. Add your preferred indexers
4. They will automatically sync to Radarr, Sonarr, and Lidarr

### Requesting Media

1. Open Overseerr (http://localhost:5055)
2. Search for a movie or TV show
3. Click Request
4. Radarr/Sonarr will automatically search and download

## 🐛 Troubleshooting

### Services not connecting

- Ensure Docker network `plexarr_default` exists
- Check container logs: `docker-compose logs [service-name]`
- Verify all containers are running: `docker-compose ps`

### Permission issues

- Ensure PUID/PGID match your user
- Check directory permissions: `ls -la /path/to/media`
- Fix with: `sudo chown -R $(id -u):$(id -g) /path/to/media`

### Can't access externally

- Verify port forwarding is configured on your router
- Check your public IP: https://whatismyip.com
- Ensure firewall allows the ports
- Test with: `curl http://your-public-ip:port`

### API coordination fails

- Wait 5 minutes after deployment for services to fully start
- Check backend logs: `docker-compose logs plexarr-backend`
- Manually run coordination: `curl -X POST http://localhost:3001/api/deploy/coordinate`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built on top of these excellent projects:
- [Plex](https://www.plex.tv/)
- [Radarr](https://radarr.video/)
- [Sonarr](https://sonarr.tv/)
- [Lidarr](https://lidarr.audio/)
- [Prowlarr](https://prowlarr.com/)
- [Overseerr](https://overseerr.dev/)
- [Maintainerr](https://github.com/jorenn92/Maintainerr)
- [NZBGet](https://nzbget.net/)
- [Nginx Proxy Manager](https://nginxproxymanager.com/)
- [WG-Easy](https://github.com/wg-easy/wg-easy)

## 📧 Support

For issues and questions, please use the GitHub Issues page.

---

Made with ❤️ for the selfhosted community

