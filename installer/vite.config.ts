import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  clearScreen: false,
  
  server: {
    port: 5173,
    strictPort: true,
  },
  
  envPrefix: ['VITE_'],
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
  
  // For Electron integration
  base: './',
  
  // Make Tauri packages optional (for backwards compatibility)
  optimizeDeps: {
    exclude: ['@tauri-apps/api'],
  },
  
  resolve: {
    alias: {
      // Stub Tauri imports when not available
      '@tauri-apps/api/tauri': '/src/stubs/tauri-stub.ts',
      '@tauri-apps/api/fs': '/src/stubs/tauri-stub.ts',
      '@tauri-apps/api/shell': '/src/stubs/tauri-stub.ts',
    }
  }
});
