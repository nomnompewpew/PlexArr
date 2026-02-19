import { app, BrowserWindow, ipcMain } from 'electron';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { statfs } from 'fs';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

// Prevent app from crashing on uncaught errors
process.on('uncaughtException', (error) => {
  // Ignore EPIPE errors which happen when logging to closed streams
  if (error.message.includes('EPIPE') || error.message.includes('write after end')) {
    return;
  }
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'PlexArr Installer',
    autoHideMenuBar: true,
  });

  // In development, load from Vite dev server
  // In production, load from built files
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Safe logging that won't crash on EPIPE errors
function safeLog(...args: any[]) {
  try {
    console.log(...args);
  } catch (error) {
    // Silently ignore logging errors (EPIPE, etc.)
  }
}

function safeError(...args: any[]) {
  try {
    console.error(...args);
  } catch (error) {
    // Silently ignore logging errors
  }
}

// IPC Handlers

/**
 * Get system information
 */
ipcMain.handle('get-system-info', async () => {
  const platform = process.platform === 'win32' ? 'windows' : 
                   process.platform === 'darwin' ? 'darwin' : 'linux';
  const arch = process.arch;
  const hostname = os.hostname();
  
  let osVersion = os.release();
  
  try {
    if (platform === 'linux') {
      const { stdout } = await execAsync('lsb_release -d -s');
      osVersion = stdout.trim().replace(/"/g, '');
    } else if (platform === 'darwin') {
      const { stdout } = await execAsync('sw_vers -productVersion');
      osVersion = stdout.trim();
    }
  } catch {
    // Use default os.release() if command fails
  }
  
  return {
    platform,
    arch,
    os_version: osVersion,
    hostname,
  };
});

/**
 * Check disk space
 */
ipcMain.handle('check-disk-space', async (_event, checkPath?: string) => {
  const pathToCheck = checkPath || os.homedir();
  
  return new Promise((resolve, reject) => {
    statfs(pathToCheck, (err, stats) => {
      if (err) {
        reject(`Failed to check disk space: ${err.message}`);
      } else {
        const available = stats.bavail * stats.bsize;
        const total = stats.blocks * stats.bsize;
        resolve({ available, total });
      }
    });
  });
});

/**
 * Execute a command and return output
 * This is the core function that replaces Tauri's execute_command
 */
ipcMain.handle('execute-command', async (_event, command: string, args: string[]) => {
  // Only log important commands to avoid EPIPE errors
  if (!command.includes('echo')) {
    safeLog(`[EXEC] ${command} ${args.slice(0, 2).join(' ')}${args.length > 2 ? '...' : ''}`);
  }
  
  return new Promise<string>((resolve, reject) => {
    // Special handling for commands that should run in background
    if (command === 'nohup') {
      // For nohup commands, spawn detached process
      const actualCommand = args[0];
      const actualArgs = args.slice(1);
      
      const child = spawn(actualCommand, actualArgs, {
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      
      child.unref(); // Allow parent to exit independently
      
      // Give it a moment to start, then resolve
      setTimeout(() => {
        resolve('Process started in background');
      }, 500);
      
      return;
    }
    
    // For regular commands, use exec
    const fullCommand = `${command} ${args.map(arg => {
      // Simple quoting - wrap in single quotes if contains spaces
      if (arg.includes(' ') && !arg.startsWith('"') && !arg.startsWith("'")) {
        return `'${arg}'`;
      }
      return arg;
    }).join(' ')}`;
    
    exec(fullCommand, { 
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      shell: '/bin/bash',
    }, (error, stdout, stderr) => {
      if (error) {
        // Only log actual errors, not expected failures
        if (!error.message.includes('sudo') && !stderr.includes('password')) {
          safeError(`[EXEC ERROR] ${error.message.substring(0, 100)}`);
        }
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
});

/**
 * Read a file
 */
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

/**
 * Write a file
 */
ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error: any) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

/**
 * Check if file/directory exists
 */
ipcMain.handle('exists', async (_event, filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

/**
 * Open external URL or file
 */
ipcMain.handle('open-external', async (_event, target: string) => {
  const { shell } = require('electron');
  await shell.openExternal(target);
});

safeLog('Electron main process initialized');
