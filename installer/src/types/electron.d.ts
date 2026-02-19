// Type declarations for Electron API in renderer process

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

export {};
