#!/usr/bin/env node

/**
 * Development script for Electron
 * Builds the electron main process and starts electron in dev mode
 */

const { spawn } = require('child_process');
const { build } = require('esbuild');
const path = require('path');

let electronProcess = null;

async function buildElectron() {
  console.log('Building Electron main process...');
  
  try {
    await build({
      entryPoints: [
        path.join(__dirname, '../electron/main.ts'),
        path.join(__dirname, '../electron/preload.ts'),
      ],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: path.join(__dirname, '../dist-electron'),
      external: ['electron'],
      sourcemap: true,
      format: 'cjs',
    });
    
    console.log('✓ Electron main process built successfully');
    return true;
  } catch (error) {
    console.error('Failed to build Electron:', error);
    return false;
  }
}

async function startElectron() {
  if (electronProcess) {
    electronProcess.kill();
  }
  
  console.log('Starting Electron...');
  
  electronProcess = spawn('electron', ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5173',
      NODE_ENV: 'development',
    },
  });
  
  electronProcess.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log('Electron exited with code', code);
    }
    process.exit(code || 0);
  });
}

async function main() {
  const success = await buildElectron();
  
  if (success) {
    // Wait a moment for Vite to be ready
    setTimeout(() => {
      startElectron();
    }, 2000);
  } else {
    process.exit(1);
  }
}

main();
