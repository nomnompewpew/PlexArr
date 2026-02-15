// Unified configuration schema for PlexArr

export interface StoragePaths {
  mediaRoot: string;        // e.g. /data/media
  downloads: string;        // e.g. /data/downloads
  config: string;           // e.g. /opt/plexarr/config
  movies?: string;          // override: defaults to {mediaRoot}/movies
  tv?: string;              // override: defaults to {mediaRoot}/tv
  music?: string;           // override: defaults to {mediaRoot}/music
}

export interface ServiceConfig {
  enabled: boolean;
  port: number;
  apiKey?: string;          // populated after deploy or entered manually
  url?: string;             // internal URL, auto-generated from container name
}

export interface SystemConfig {
  timezone: string;         // e.g. America/New_York
  puid: number;
  pgid: number;
  projectFolder: string;    // Host path where stack compose files are stored (e.g., /opt/plexarr)
}

export interface NetworkConfig {
  publicIp?: string;
  publicDomain?: string;
}

export interface AIAgentConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey?: string;
  model?: string;
}

export interface PlexArrConfig {
  version: number;          // schema version for migrations
  system: SystemConfig;
  network: NetworkConfig;
  storage: StoragePaths;
  aiAgent?: AIAgentConfig;  // optional AI agent for automated configuration
  services: {
    plex: ServiceConfig;
    radarr: ServiceConfig;
    sonarr: ServiceConfig;
    lidarr: ServiceConfig;
    prowlarr: ServiceConfig;
    overseerr: ServiceConfig;
    maintainerr: ServiceConfig;
    nzbget: ServiceConfig;       // NZBMedia (movies + TV)
    nzbgetMusic?: ServiceConfig; // NZBMusic (music downloads)
    qbittorrent?: ServiceConfig;
    metube?: ServiceConfig;
    nginxProxyManager?: ServiceConfig;
    wireguard?: ServiceConfig;
  };
}
