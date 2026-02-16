/**
 * Installation state machine states
 */
export type InstallationState = 
  | 'initial'
  | 'checking_prerequisites'
  | 'downloading_dependencies'
  | 'installing_wsl2'
  | 'rebooting_for_wsl2'
  | 'installing_docker'
  | 'configuring_docker'
  | 'adding_to_docker_group'
  | 'relogin_required'
  | 'installing_plexarr'
  | 'completed'
  | 'failed';

/**
 * Platform types
 */
export type Platform = 'windows' | 'darwin' | 'linux';

/**
 * Architecture types
 */
export type Architecture = 'x64' | 'arm64' | 'arm';

/**
 * Linux distribution types
 */
export type LinuxDistro = 'ubuntu' | 'debian' | 'fedora' | 'arch' | 'centos' | 'rhel' | 'unknown';

/**
 * System information
 */
export interface SystemInfo {
  platform: Platform;
  arch: Architecture;
  osVersion: string;
  hostname: string;
  distro?: LinuxDistro;
  distroVersion?: string;
}

/**
 * Prerequisite check result
 */
export interface PrerequisiteCheck {
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  message: string;
  required: boolean;
  canAutoFix: boolean;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  url: string;
  fileName: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

/**
 * Installation step
 */
export interface InstallationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  error?: string;
  progress?: number; // 0-100
  startTime?: number;
  endTime?: number;
}

/**
 * Manual installation instructions
 */
export interface ManualInstructions {
  title: string;
  description: string;
  officialUrl: string;
  steps: string[];
  copyableCommands?: string[];
}

/**
 * Installation state (persisted to disk)
 */
export interface InstallationStateData {
  version: number; // State schema version
  currentState: InstallationState;
  systemInfo: SystemInfo;
  checks: PrerequisiteCheck[];
  steps: InstallationStep[];
  installationPath?: string;
  dockerPath?: string;
  wsl2Installed?: boolean;
  dockerInstalled?: boolean;
  dockerComposeInstalled?: boolean;
  userInDockerGroup?: boolean;
  puid?: number;
  pgid?: number;
  errors: string[];
  lastUpdated: number;
  resumeAfterReboot?: boolean;
  resumeAfterRelogin?: boolean;
}

/**
 * Docker download URLs
 */
export interface DockerDownloadUrls {
  windows: string;
  macIntel: string;
  macAppleSilicon: string;
  linuxScript: string;
}

/**
 * WSL2 download URL
 */
export interface WSL2DownloadUrl {
  kernelUpdate: string;
}

/**
 * Disk space information
 */
export interface DiskSpace {
  available: number; // bytes
  total: number; // bytes
  required: number; // bytes (estimated)
}

/**
 * Error with recovery options
 */
export interface InstallationError {
  code: string;
  message: string;
  details?: string;
  manualInstructions?: ManualInstructions;
  canRetry: boolean;
  canSkip: boolean;
  recoveryActions: RecoveryAction[];
}

/**
 * Recovery action for errors
 */
export interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void>;
}

/**
 * Configuration for installer
 */
export interface InstallerConfig {
  dockerUrls: DockerDownloadUrls;
  wsl2Urls: WSL2DownloadUrl;
  minDiskSpaceGB: number;
  minDiskSpaceForDockerGB: number;
  stateFilePath: string;
  logFilePath: string;
  downloadDirectory: string;
}
