// Stub for Tauri API when running in Electron mode
// This prevents Vite from erroring when Tauri packages aren't installed

export const invoke = () => {
  throw new Error('Tauri not available - use platformAPI');
};

export const readTextFile = () => {
  throw new Error('Tauri not available - use platformAPI');
};

export const writeTextFile = () => {
  throw new Error('Tauri not available - use platformAPI');
};

export const exists = () => {
  throw new Error('Tauri not available - use platformAPI');
};

export const open = () => {
  throw new Error('Tauri not available - use platformAPI');
};

export default {
  invoke,
  readTextFile,
  writeTextFile,
  exists,
  open
};
