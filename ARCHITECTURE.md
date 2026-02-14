# PlexArr System Architecture

## Overview

PlexArr creates a unified media server stack with automatic API coordination between all services.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                    http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PlexArr Frontend (React)                      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Welcome  │→ │  System  │→ │ Network  │→ │ Services │       │
│  │   Step   │  │  Config  │  │  Setup   │  │ Selection│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  Review  │→ │  Deploy  │→ │Dashboard │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              PlexArr Backend (Node.js/Express)                  │
│                   http://localhost:3001                         │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Wizard API     │  │  Config API      │  │  Deploy API  │  │
│  │  /api/wizard/*  │  │  /api/config/*   │  │  /api/deploy/*  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         API Coordination Service                        │   │
│  │  • Connects Prowlarr to Radarr/Sonarr/Lidarr          │   │
│  │  • Adds NZBGet to *arr apps                           │   │
│  │  • Configures Overseerr with Plex + *arr              │   │
│  │  • Sets up Maintainerr with Plex                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      Docker Compose Generator                           │   │
│  │  Generates docker-compose.yml from user configuration   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────┐                                           │
│  │ SQLite Database │                                           │
│  │  • Configurations                                           │
│  │  • API Keys                                                 │
│  │  • Deployments                                              │
│  └─────────────────┘                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ Generates
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              generated-config/docker-compose.yml                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Docker Compose Up
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network                               │
│                    plexarr_default                              │
│                                                                 │
│  All services communicate using container names                 │
│  (e.g., http://radarr:7878, http://sonarr:8989)                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│     Plex     │      │   Radarr     │      │   Sonarr     │
│   :32400     │◄─────┤   :7878      │      │   :8989      │
│              │      │              │      │              │
└──────────────┘      └──────┬───────┘      └──────┬───────┘
                             │                     │
                             │  ┌──────────────────┘
                             ▼  ▼
                      ┌──────────────┐
                      │              │
                      │  Prowlarr    │◄──── Manages Indexers
                      │   :9696      │      for all *arr apps
                      │              │
                      └──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐      ┌──────────────┐    ┌──────────────┐
│              │      │              │    │              │
│   Lidarr     │      │  Overseerr   │    │ Maintainerr  │
│   :8686      │      │   :5055      │    │   :6246      │
│              │      │              │    │              │
└──────┬───────┘      └──────────────┘    └──────────────┘
       │
       │  All Download via
       ▼
┌──────────────┐      ┌──────────────┐    ┌──────────────┐
│              │      │              │    │              │
│   NZBGet     │      │  NZBGet 2    │    │  WireGuard   │
│   :6789      │      │   :6790      │    │   :51820     │
│              │      │  (optional)  │    │  (optional)  │
└──────────────┘      └──────────────┘    └──────────────┘

┌──────────────────────────────────────────────────────────┐
│                                                          │
│         Nginx Proxy Manager (optional)                   │
│              :80, :443, :81                              │
│    • Reverse proxy for all services                      │
│    • SSL/TLS with Let's Encrypt                          │
│    • Easy subdomain setup                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Setup Flow

```
User → Wizard → Backend API → Generate docker-compose.yml → Deploy Stack
```

### 2. API Coordination Flow

```
Backend → Prowlarr API → Get API Key
       → Radarr API → Connect Prowlarr
       → Sonarr API → Connect Prowlarr
       → Lidarr API → Connect Prowlarr
       → Overseerr API → Connect Plex + Radarr + Sonarr
       → Maintainerr API → Connect Plex
```

### 3. Media Request Flow

```
User → Overseerr → Request Movie/Show
     → Radarr/Sonarr → Search via Prowlarr
     → NZBGet → Download
     → Radarr/Sonarr → Organize & Rename
     → Plex Library → Media Available
```

## Storage Architecture

```
/path/to/media/
├── movies/              # Radarr manages
│   ├── Movie 1 (2020)/
│   └── Movie 2 (2021)/
├── tv/                  # Sonarr manages
│   ├── Show 1/
│   │   ├── Season 01/
│   │   └── Season 02/
│   └── Show 2/
├── music/               # Lidarr manages
│   ├── Artist 1/
│   └── Artist 2/
└── downloads/           # NZBGet downloads to
    ├── movies/
    ├── tv/
    └── music/
```

## Network Architecture

```
┌─────────────────────────────────────────┐
│          Internet                       │
└────────────┬────────────────────────────┘
             │
             │ Port Forwarding
             ▼
┌─────────────────────────────────────────┐
│          Router                         │
│  Forwards:                              │
│    80 → Nginx                           │
│    443 → Nginx                          │
│    32400 → Plex                         │
│    51820 → WireGuard (if enabled)       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Docker Host                        │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  plexarr_default network       │    │
│  │                                 │    │
│  │  All containers communicate     │    │
│  │  using container names          │    │
│  └────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

## Security Model

1. **API Keys**: Automatically generated and stored in SQLite database
2. **Network Isolation**: Services on isolated Docker networks
3. **No Exposed Credentials**: API keys never exposed to frontend
4. **Optional SSL**: Nginx Proxy Manager provides Let's Encrypt SSL
5. **VPN Access**: Optional WireGuard for secure remote access

## Automation Flow

```
1. User installs and runs wizard
   └─> Configures all services
   
2. PlexArr generates docker-compose.yml
   └─> All services defined with proper networking
   
3. User deploys with docker-compose up
   └─> All containers start
   
4. PlexArr automatically coordinates
   └─> Prowlarr connected to all *arr apps
   └─> Download clients configured
   └─> Overseerr connected to Plex + *arr
   └─> Maintainerr connected to Plex
   
5. User adds indexers to Prowlarr
   └─> Automatically synced to all *arr apps
   
6. Ready to use!
   └─> Request media via Overseerr
   └─> *arr apps search via Prowlarr
   └─> NZBGet downloads
   └─> Media added to Plex automatically
```

## Key Features

- **Zero Manual API Configuration**: All services auto-connected
- **Shared Docker Networks**: Container name resolution
- **Persistent Storage**: SQLite for configuration
- **Template-Based**: Easy to add new services
- **User-Friendly**: Wizard guides through setup
- **Production Ready**: Dockerized and scalable
