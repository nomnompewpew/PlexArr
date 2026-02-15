# Changelog

All notable changes to PlexArr will be documented in this file.

## [Unreleased]

### Added - New Services
- **qBittorrent** - BitTorrent download client support
  - LinuxServer.io qBittorrent image
  - Default port 8080
  - Integrated with downloads directory
  - Optional service (disabled by default)

- **MeTube** - YouTube and video downloader
  - ghcr.io/alexta69/metube image
  - Default port 8081
  - Downloads to main downloads directory
  - Optional service (disabled by default)

- **NZBGet (Music)** - Second NZBGet instance for music
  - Separate instance for Lidarr downloads
  - Default port 6790
  - Dedicated music downloads directory
  - Optional service (disabled by default)

### Added - AI Agent Integration
- **AI-Powered Configuration Assistant**
  - Support for multiple AI providers:
    - Google Gemini (recommended for free tier)
    - OpenAI GPT-4
    - Anthropic Claude
  - Configuration analysis and optimization
  - Personalized indexer recommendations
  - Quality profile suggestions
  - Connection troubleshooting assistance
  - Optional feature with encrypted API key storage

- **AI Agent Features**:
  - Analyze entire configuration for improvements
  - Suggest optimal indexers based on region and services
  - Recommend quality profiles for Radarr, Sonarr, Lidarr
  - Troubleshoot connection issues between services
  - Privacy-focused: only accesses configuration metadata

- **New API Endpoints**:
  - `POST /api/ai-agent/analyze` - Configuration analysis
  - `POST /api/ai-agent/suggest-indexers` - Indexer recommendations
  - `POST /api/ai-agent/suggest-quality-profiles` - Quality profile suggestions
  - `POST /api/ai-agent/troubleshoot` - Connection troubleshooting

### Added - Post-Deployment Wizard
- **Automated Service Configuration**
  - Run after containers are deployed
  - Displays service status (running/not running)
  - Automatic API key extraction
  - One-click service connection
  - Real-time progress tracking
  - Error handling with detailed messages

- **Configuration Steps**:
  1. Extract API keys from Prowlarr, Radarr, Sonarr
  2. Register Arr apps in Prowlarr
  3. Configure download clients (NZBGet)
  4. Initialize Overseerr with Plex connection

### Added - UI Components
- **AIAgentStep** - Wizard step for AI agent configuration
  - Provider selection dropdown
  - Secure API key input (show/hide toggle)
  - Custom model specification
  - Feature overview and privacy notice
  - Cost estimates for each provider

- **PostDeploymentWizard** - Post-deployment configuration interface
  - Service status cards with running indicators
  - Direct links to service UIs
  - Step-by-step configuration progress
  - Visual status indicators (✓, ✗, ⟳, ○)
  - Completion redirect to dashboard

### Enhanced - Configuration Schema
- Extended `PlexArrConfig` interface with:
  - `aiAgent` - Optional AI agent configuration
  - `nzbgetMusic` - Second NZBGet instance
  - `qbittorrent` - BitTorrent client
  - `metube` - Video downloader

- Added `AIAgentConfig` interface:
  - `enabled` - Toggle AI agent
  - `provider` - AI provider selection
  - `apiKey` - Encrypted API key storage
  - `model` - Custom model specification

### Enhanced - Service Labels
- Renamed service labels for clarity:
  - `NZBGet` → `NZBGet (Media)` - for movies & TV
  - Added `NZBGet (Music)` - for music downloads
  - Added descriptions to all services in wizard

### Enhanced - Compose Generation
- Added qBittorrent container with:
  - Proper PUID/PGID/TZ environment
  - Config and downloads volume mounts
  - Network attachment to plexarr_default

- Added MeTube container with:
  - Timezone configuration
  - Downloads volume mount
  - Network attachment to plexarr_default

- Added second NZBGet container with:
  - Unique container name (`nzbget-music`)
  - Separate config directory
  - Dedicated music downloads path
  - Distinct port mapping (6790:6789)

### Enhanced - Documentation
- **AI_AGENT_GUIDE.md** - Comprehensive AI agent documentation
  - Setup instructions for each provider
  - Feature descriptions and use cases
  - Privacy and security considerations
  - Cost estimates
  - Troubleshooting guide
  - Best practices

- **README.md** updates:
  - Added download clients section
  - Updated service list with new services
  - Added AI agent overview
  - Updated port table with new services
  - Enhanced feature list

### Enhanced - Testing
- Added Jest configuration for backend tests
- Created comprehensive test suite for config defaults
  - Validates all required services
  - Tests new service defaults
  - Verifies port assignments
  - Ensures disabled state for optional services

- Created compose generator test suite
  - Tests service inclusion/exclusion
  - Validates Docker image names
  - Verifies port mappings
  - Tests volume configurations
  - Checks environment variables
  - Validates network attachment

### Technical Improvements
- Proper TypeScript typing for all new components
- Consistent error handling in AI agent routes
- Secure API key handling (never logged or exposed)
- Encrypted storage of AI provider API keys
- Network isolation maintained for all services
- Docker networking properly configured

### Security
- All AI communications over HTTPS
- API keys encrypted in database
- No sensitive data sent to AI providers
- Privacy-focused: only configuration metadata shared
- CodeQL security scan passed with 0 alerts

## [1.0.0] - Previous Version

### Features
- Initial PlexArr release
- Core Arr services (Plex, Radarr, Sonarr, Lidarr)
- Prowlarr indexer management
- Overseerr media requests
- Maintainerr collection management
- Single NZBGet instance
- Optional Nginx Proxy Manager
- Optional WireGuard VPN
- Setup wizard
- Automatic API coordination
- Docker Compose generation
