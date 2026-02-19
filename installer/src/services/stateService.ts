import { platformAPI } from './platformAPI';
import type { InstallationStateData, InstallationState, SystemInfo, LinuxDistro } from '../types/installer';

const STATE_FILE_NAME = 'installation-state.json';
const STATE_VERSION = 1;
// Use /tmp for state file - it's a temporary file anyway and avoids Tauri permission issues
const STATE_FILE_PATH = `/tmp/plexarr-${STATE_FILE_NAME}`;

/**
 * Service for managing installation state persistence
 */
export class StateService {
  /**
   * Initialize the state service
   */
  async initialize(): Promise<void> {
    // No initialization needed for /tmp path
  }

  /**
   * Load state from disk, or create initial state
   */
  async loadState(): Promise<InstallationStateData> {
    try {
      if (await platformAPI.exists(STATE_FILE_PATH)) {
        const content = await platformAPI.readFile(STATE_FILE_PATH);
        const state = JSON.parse(content) as InstallationStateData;
        
        // Migrate state if version mismatch
        return this.migrateState(state);
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }

    // Return initial state if file doesn't exist or failed to load
    return this.createInitialState();
  }

  /**
   * Save state to disk
   */
  async saveState(state: InstallationStateData): Promise<void> {

    state.lastUpdated = Date.now();
    state.version = STATE_VERSION;

    try {
      await platformAPI.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error);
      throw new Error(`Failed to save installation state: ${error}`);
    }
  }

  /**
   * Create initial state
   */
  private async createInitialState(): Promise<InstallationStateData> {
    const systemInfo = await this.getSystemInfo();

    return {
      version: STATE_VERSION,
      currentState: 'initial' as InstallationState,
      systemInfo,
      checks: [],
      steps: [],
      errors: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Migrate state from older versions
   */
  private migrateState(state: InstallationStateData): InstallationStateData {
    if (state.version === STATE_VERSION) {
      return state;
    }

    // Add migration logic here for future versions
    console.log(`Migrating state from version ${state.version} to ${STATE_VERSION}`);
    
    return {
      ...state,
      version: STATE_VERSION,
    };
  }

  /**
   * Get system information
   */
  private async getSystemInfo(): Promise<SystemInfo> {
    try {
      const info = await platformAPI.getSystemInfo();

      const systemInfo: SystemInfo = {
        platform: info.platform as any,
        arch: info.arch as any,
        osVersion: info.os_version,
        hostname: info.hostname,
      };

      // Get Linux distro if applicable
      if (systemInfo.platform === 'linux') {
        try {
          const distroInfo = await this.detectLinuxDistro();
          const validDistros: LinuxDistro[] = ['ubuntu', 'debian', 'fedora', 'arch', 'centos', 'rhel', 'unknown'];
          systemInfo.distro = (validDistros.includes(distroInfo.distro as LinuxDistro) 
            ? distroInfo.distro 
            : 'unknown') as LinuxDistro;
          systemInfo.distroVersion = distroInfo.version;
        } catch (error) {
          console.warn('Failed to detect Linux distribution:', error);
        }
      }

      return systemInfo;
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw new Error(`Failed to get system information: ${error}`);
    }
  }

  /**
   * Detect Linux distribution
   */
  private async detectLinuxDistro(): Promise<{ distro: string; version: string }> {
    try {
      const osReleaseContent = await platformAPI.readFile('/etc/os-release');
      const lines = osReleaseContent.split('\n');
      
      let distro = 'unknown';
      let version = '';

      for (const line of lines) {
        if (line.startsWith('ID=')) {
          distro = line.substring(3).replace(/"/g, '').toLowerCase();
        } else if (line.startsWith('VERSION_ID=')) {
          version = line.substring(11).replace(/"/g, '');
        }
      }

      return { distro, version };
    } catch (error) {
      return { distro: 'unknown', version: '' };
    }
  }

  /**
   * Clear state (for debugging or reset)
   */
  async clearState(): Promise<void> {
    const state = await this.createInitialState();
    await this.saveState(state);
  }

  /**
   * Get state file path
   */
  async getStateFilePath(): Promise<string> {
    return STATE_FILE_PATH;
  }
}

// Export singleton instance
export const stateService = new StateService();
