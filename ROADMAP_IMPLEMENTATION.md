# PlexArr Roadmap Implementation

This document describes the new endpoints and components implemented for the PlexArr roadmap.

## Backend API Endpoints

### Configuration Management (`/api/config-new`)

#### GET `/api/config-new`
Returns the current configuration with API keys redacted.

**Response:**
```json
{
  "version": 1,
  "system": {
    "timezone": "America/New_York",
    "puid": 1000,
    "pgid": 1000
  },
  "network": {},
  "storage": {
    "mediaRoot": "/data/media",
    "downloads": "/data/downloads",
    "config": "/opt/plexarr/config"
  },
  "services": {
    "plex": {"enabled": true, "port": 32400},
    "radarr": {"enabled": true, "port": 7878},
    ...
  }
}
```

#### PUT `/api/config-new`
Save a full configuration.

**Request Body:** PlexArrConfig object

**Response:**
```json
{
  "status": "saved"
}
```

#### POST `/api/config-new/validate`
Validate a configuration without saving.

**Request Body:** PlexArrConfig object

**Response:**
```json
{
  "valid": true,
  "errors": []
}
```

Or with errors:
```json
{
  "valid": false,
  "errors": [
    {"field": "storage.mediaRoot", "message": "Must be an absolute path"},
    {"field": "system.puid", "message": "Must be a positive integer"},
    {"field": "services.radarr.port", "message": "Port 32400 conflicts with plex"}
  ]
}
```

#### POST `/api/config-new/check-path`
Check if a host path exists and is writable.

**Request Body:**
```json
{
  "path": "/tmp"
}
```

**Response:**
```json
{
  "exists": true,
  "isDirectory": true,
  "writable": true
}
```

### Service Testing (`/api/services`)

#### POST `/api/services/test`
Test connectivity to a service.

**Request Body:**
```json
{
  "service": "plex",
  "port": 32400,
  "apiKey": "optional-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected"
}
```

Or on failure:
```json
{
  "success": false,
  "message": "Connection refused — service may not be running yet"
}
```

### Deployment (`/api/deploy-new`)

#### POST `/api/deploy-new/preview`
Generate docker-compose.yml without deploying.

**Request Body:** PlexArrConfig object

**Response:** YAML text

```yaml
version: '3.8'
services:
  plex:
    image: lscr.io/linuxserver/plex:latest
    container_name: plex
    ...
```

#### POST `/api/deploy-new/execute`
Generate and deploy the stack.

**Request Body:** PlexArrConfig object

**Response:**
```json
{
  "success": true,
  "composePath": "/path/to/docker-compose.yml",
  "stdout": "...",
  "stderr": "..."
}
```

#### GET `/api/deploy-new/status`
Get container health status.

**Response:**
```json
{
  "containers": [
    {
      "Name": "plex",
      "State": "running",
      "Status": "Up 5 minutes"
    },
    ...
  ]
}
```

#### POST `/api/deploy-new/coordinate`
Run service coordination with retry logic.

**Request Body:**
```json
{
  "configBasePath": "/opt/plexarr/config"
}
```

**Response:**
```json
{
  "results": [
    {
      "step": "Extract API keys from config files",
      "success": true,
      "message": "OK",
      "retries": 0
    },
    ...
  ]
}
```

## Frontend Components

### Wizard Steps

#### `StorageStep.tsx`
- Configure storage paths with real-time validation
- Check if paths exist and are writable
- Support for per-library overrides

#### `ServicesStep.tsx`
- Enable/disable services
- Configure ports
- Test service connectivity

#### `ReviewStep.tsx`
- Review all configuration
- Deploy the stack
- Show deployment results

### Dashboard

#### `Dashboard.tsx`
- Monitor container health
- Refresh status
- Run service coordination

## Configuration Schema

```typescript
interface PlexArrConfig {
  version: number;
  system: {
    timezone: string;
    puid: number;
    pgid: number;
  };
  network: {
    publicIp?: string;
    publicDomain?: string;
  };
  storage: {
    mediaRoot: string;
    downloads: string;
    config: string;
    movies?: string;
    tv?: string;
    music?: string;
  };
  services: {
    plex: ServiceConfig;
    radarr: ServiceConfig;
    sonarr: ServiceConfig;
    lidarr: ServiceConfig;
    prowlarr: ServiceConfig;
    overseerr: ServiceConfig;
    maintainerr: ServiceConfig;
    nzbget: ServiceConfig;
    nginxProxyManager?: ServiceConfig;
    wireguard?: ServiceConfig;
  };
}

interface ServiceConfig {
  enabled: boolean;
  port: number;
  apiKey?: string;
  url?: string;
}
```

## Validation Rules

1. **Storage Paths**: Must be absolute paths (start with `/`)
2. **PUID/PGID**: Must be positive integers
3. **Ports**: No conflicts allowed between enabled services
4. **API Keys**: Optional during configuration, populated after deployment

## Testing

Test the endpoints with curl:

```bash
# Get default config
curl http://localhost:3001/api/config-new

# Validate config
curl -X POST http://localhost:3001/api/config-new/validate \
  -H "Content-Type: application/json" \
  -d @config.json

# Check path
curl -X POST http://localhost:3001/api/config-new/check-path \
  -H "Content-Type: application/json" \
  -d '{"path": "/tmp"}'

# Test service
curl -X POST http://localhost:3001/api/services/test \
  -H "Content-Type: application/json" \
  -d '{"service": "plex", "port": 32400}'

# Preview deployment
curl -X POST http://localhost:3001/api/deploy-new/preview \
  -H "Content-Type: application/json" \
  -d @config.json
```
