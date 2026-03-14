// Configuration validation service

import { PlexArrConfig } from '../models/config';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: PlexArrConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // --- storage paths ---
  for (const [key, path] of Object.entries(config.storage)) {
    if (!path) continue;
    if (typeof path !== 'string') continue;
    if (!path.startsWith('/')) {
      errors.push({ field: `storage.${key}`, message: 'Must be an absolute path' });
    } else if (!/^\/[\w/._-]*$/.test(path)) {
      errors.push({ field: `storage.${key}`, message: 'Path contains invalid characters (only alphanumerics, /, ., _, - are allowed)' });
    }
  }

  // --- PUID/PGID ---
  if (!Number.isInteger(config.system.puid) || config.system.puid <= 0) {
    errors.push({ field: 'system.puid', message: 'Must be a positive integer' });
  }
  if (!Number.isInteger(config.system.pgid) || config.system.pgid <= 0) {
    errors.push({ field: 'system.pgid', message: 'Must be a positive integer' });
  }

  // --- projectFolder path ---
  if (config.system.projectFolder) {
    if (!config.system.projectFolder.startsWith('/')) {
      errors.push({ field: 'system.projectFolder', message: 'Must be an absolute path' });
    } else if (!/^\/[\w/._-]*$/.test(config.system.projectFolder)) {
      errors.push({ field: 'system.projectFolder', message: 'Path contains invalid characters (only alphanumerics, /, ., _, - are allowed)' });
    }
  }

  // --- port conflicts ---
  const usedPorts = new Map<number, string>();
  for (const [name, svc] of Object.entries(config.services)) {
    if (!svc || !svc.enabled) continue;
    if (!Number.isInteger(svc.port) || svc.port < 1 || svc.port > 65535) {
      errors.push({
        field: `services.${name}.port`,
        message: `Port ${svc.port} is not a valid port number (must be 1–65535)`,
      });
      continue;
    }
    if (usedPorts.has(svc.port)) {
      errors.push({
        field: `services.${name}.port`,
        message: `Port ${svc.port} conflicts with ${usedPorts.get(svc.port)}`,
      });
    } else {
      usedPorts.set(svc.port, name);
    }
  }

  // --- required fields per enabled service ---
  // (api keys are optional at config time; populated after deploy)

  return errors;
}
