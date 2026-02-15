// Unified PlexArr configuration types for frontend

export interface StoragePaths {
  mediaRoot: string;
  downloads: string;
  config: string;
  movies?: string;
  tv?: string;
  music?: string;
}

export interface ServiceConfig {
  enabled: boolean;
  port: number;
  apiKey?: string;
  url?: string;
}

export interface SystemConfig {
  timezone: string;
  puid: number;
  pgid: number;
  projectFolder: string; // Host path where stack compose files are stored (e.g., /opt/plexarr)
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
  version: number;
  system: SystemConfig;
  network: NetworkConfig;
  storage: StoragePaths;
  aiAgent?: AIAgentConfig;
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

export interface StepResult {
  step: string;
  success: boolean;
  message: string;
  retries: number;
}

export interface CoordinationStatus {
  running?: boolean;
  results?: StepResult[];
  error?: string;
}
