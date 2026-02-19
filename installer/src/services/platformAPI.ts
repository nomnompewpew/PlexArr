/**
 * Platform abstraction layer - works with both Tauri and Electron
 * Automatically detects which framework is available
 */

export interface SystemInfo {
  platform: string;
  arch: string;
  os_version: string;
  hostname: string;
}

export interface DiskSpace {
  available: number;
  total: number;
}

class PlatformAPI {
  private isElectron: boolean;
  private isTauri: boolean;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
    this.isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
    
    console.log(`Platform API initialized - Electron: ${this.isElectron}, Tauri: ${this.isTauri}`);
  }

  async getSystemInfo(): Promise<SystemInfo> {
    if (this.isElectron) {
      return window.electronAPI.getSystemInfo();
    } else if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<SystemInfo>('get_system_info');
    }
    throw new Error('No supported platform API available');
  }

  async checkDiskSpace(path?: string): Promise<DiskSpace> {
    if (this.isElectron) {
      return window.electronAPI.checkDiskSpace(path);
    } else if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<DiskSpace>('check_disk_space', { path: path || '' });
    }
    throw new Error('No supported platform API available');
  }

  async executeCommand(command: string, args: string[]): Promise<string> {
    if (this.isElectron) {
      return window.electronAPI.executeCommand(command, args);
    } else if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<string>('execute_command', { command, args });
    }
    throw new Error('No supported platform API available');
  }

  async readFile(filePath: string): Promise<string> {
    if (this.isElectron) {
      return window.electronAPI.readFile(filePath);
    } else if (this.isTauri) {
      const { readTextFile } = await import('@tauri-apps/api/fs');
      return await readTextFile(filePath);
    }
    throw new Error('No supported platform API available');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.writeFile(filePath, content);
    } else if (this.isTauri) {
      const { writeTextFile } = await import('@tauri-apps/api/fs');
      await writeTextFile(filePath, content);
    } else {
      throw new Error('No supported platform API available');
    }
  }

  async exists(filePath: string): Promise<boolean> {
    if (this.isElectron) {
      return window.electronAPI.exists(filePath);
    } else if (this.isTauri) {
      const { exists } = await import('@tauri-apps/api/fs');
      return await exists(filePath);
    }
    throw new Error('No supported platform API available');
  }

  async openExternal(url: string): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI.openExternal(url);
    } else if (this.isTauri) {
      const { open } = await import('@tauri-apps/api/shell');
      await open(url);
    } else {
      throw new Error('No supported platform API available');
    }
  }

  getFramework(): 'electron' | 'tauri' | 'unknown' {
    if (this.isElectron) return 'electron';
    if (this.isTauri) return 'tauri';
    return 'unknown';
  }
}

export const platformAPI = new PlatformAPI();
