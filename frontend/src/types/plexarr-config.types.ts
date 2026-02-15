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

export interface PlexArrConfig {
  version: number;
  system: SystemConfig;
  network: NetworkConfig;
  storage: StoragePaths;
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
