import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for secure IPC communication
 * This exposes a limited API to the renderer process
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

// Expose protected methods via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  getSystemInfo: (): Promise<SystemInfo> => {
    return ipcRenderer.invoke('get-system-info');
  },
  
  // Disk space checking
  checkDiskSpace: (path?: string): Promise<DiskSpace> => {
    return ipcRenderer.invoke('check-disk-space', path);
  },
  
  // Command execution (core function)
  executeCommand: (command: string, args: string[]): Promise<string> => {
    return ipcRenderer.invoke('execute-command', command, args);
  },
  
  // File operations
  readFile: (filePath: string): Promise<string> => {
    return ipcRenderer.invoke('read-file', filePath);
  },
  
  writeFile: (filePath: string, content: string): Promise<boolean> => {
    return ipcRenderer.invoke('write-file', filePath, content);
  },
  
  exists: (filePath: string): Promise<boolean> => {
    return ipcRenderer.invoke('exists', filePath);
  },
  
  // Open external links
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke('open-external', url);
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<SystemInfo>;
      checkDiskSpace: (path?: string) => Promise<DiskSpace>;
      executeCommand: (command: string, args: string[]) => Promise<string>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      exists: (filePath: string) => Promise<boolean>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

console.log('Electron preload script initialized');
