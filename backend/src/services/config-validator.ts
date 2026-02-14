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
    }
  }

  // --- PUID/PGID ---
  if (config.system.puid <= 0) {
    errors.push({ field: 'system.puid', message: 'Must be a positive integer' });
  }
  if (config.system.pgid <= 0) {
    errors.push({ field: 'system.pgid', message: 'Must be a positive integer' });
  }

  // --- port conflicts ---
  const usedPorts = new Map<number, string>();
  for (const [name, svc] of Object.entries(config.services)) {
    if (!svc || !svc.enabled) continue;
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
