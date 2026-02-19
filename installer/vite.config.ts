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
});
