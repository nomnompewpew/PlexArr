// Database models and types for PlexArr configuration

export interface Configuration {
  id: string;
  created_at: string;
  updated_at: string;
  setup_completed: boolean;
  config_data: string; // JSON string of ConfigData
}

export interface ConfigData {
  // System Configuration
  system: SystemConfig;
  
  // Network Configuration
  network: NetworkConfig;
  
  // Service Configurations
  services: ServiceConfigs;
  
  // Generated API Keys (stored securely)
  apiKeys: ApiKeys;
}

export interface SystemConfig {
  timezone: string;
  puid: number;
  pgid: number;
  projectFolder: string; // Host path where stack compose files are stored (e.g., /opt/plexarr)
}

export interface NetworkConfig {
  // External access
  publicIp?: string;
  publicDomain?: string;
  
  // Network names
  adguardNetwork: boolean;
  stacksNetwork: boolean;
  
  // Port forwarding help
  portForwardingConfigured: boolean;
}

export interface ServiceConfigs {
  nginxProxyManager: NginxProxyManagerConfig;
  radarr: RadarrConfig;
  sonarr: SonarrConfig;
  prowlarr: ProwlarrConfig;
  lidarr: LidarrConfig;
  plex: PlexConfig;
  overseerr: OverseerrConfig;
  wgEasy: WgEasyConfig;
  nzbget: NzbgetConfig;
  nzbget2: Nzbget2Config;
  lidify: LidifyConfig;
  maintainerr: MaintainerrConfig;
}

export interface NginxProxyManagerConfig {
  enabled: boolean;
  adminPort: number;
  httpPort: number;
  httpsPort: number;
  dataPath: string;
  letsencryptPath: string;
}

export interface RadarrConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  downloadsRoot: string;
  moviesDownloadPath: string;
  nzbPath: string;
  moviesLibrary: string;
  completedPath: string;
  classicsDownloadPath: string;
  apiKey?: string;
}

export interface SonarrConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  downloadsRoot: string;
  tvDownloadPath: string;
  nzbPath: string;
  tvLibrary: string;
  completedTvPath: string;
  apiKey?: string;
}

export interface ProwlarrConfig {
  enabled: boolean;
  port: number;
  mediaRoot: string;
  apiKey?: string;
}

export interface LidarrConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  musicLibrary: string;
  musicDownloads: string;
  apiKey?: string;
}

export interface PlexConfig {
  enabled: boolean;
  useGpu: boolean;
  plexClaim?: string;
  moviesDownloadPath: string;
  tvDownloadPath: string;
  disneyDownloadPath: string;
  musicRoot: string;
  youtubeMusicPath: string;
  moviesLibrary: string;
  tvLibrary: string;
  completedTvPath: string;
  walkthroughsPath: string;
  classicsDownloadPath: string;
  newMoviesPath: string;
}

export interface OverseerrConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  plexMediaRoot: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  apiKey?: string;
}

export interface WgEasyConfig {
  enabled: boolean;
  wgHost: string;
  passwordHash: string;
  uiPort: number;
  configPath: string;
}

export interface NzbgetConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  musicDownloads: string;
}

export interface Nzbget2Config {
  enabled: boolean;
  port: number;
  configPath: string;
  plexMediaRoot: string;
}

export interface LidifyConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  cleanMusicPath: string;
  lastFmApiKey?: string;
  lastFmApiSecret?: string;
}

export interface MaintainerrConfig {
  enabled: boolean;
  port: number;
  configPath: string;
  apiKey?: string;
}

export interface ApiKeys {
  radarr?: string;
  sonarr?: string;
  prowlarr?: string;
  lidarr?: string;
  overseerr?: string;
  maintainerr?: string;
}

// Wizard steps
export enum WizardStep {
  WELCOME = 'welcome',
  SYSTEM = 'system',
  NETWORK = 'network',
  PATHS = 'paths',
  SERVICES = 'services',
  NGINX_PROXY = 'nginx-proxy',
  PLEX = 'plex',
  ARR_APPS = 'arr-apps',
  DOWNLOAD_CLIENTS = 'download-clients',
  EXTRAS = 'extras',
  REVIEW = 'review',
  DEPLOY = 'deploy'
}
