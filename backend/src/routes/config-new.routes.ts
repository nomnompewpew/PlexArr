// Config routes with validation and path checking

import { Router, Request, Response } from 'express';
import { PlexArrConfig } from '../models/config';
import { createDefaultConfig } from '../models/config-defaults';
import { validateConfig } from '../services/config-validator';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

function loadConfig(): PlexArrConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }
  return createDefaultConfig();
}

function saveConfig(config: PlexArrConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// GET /api/config - return current config
router.get('/', (_req: Request, res: Response) => {
  const config = loadConfig();
  // redact API keys for the response
  const safe = JSON.parse(JSON.stringify(config));
  for (const svc of Object.values(safe.services)) {
    if ((svc as any).apiKey) (svc as any).apiKey = '••••••••';
  }
  res.json(safe);
});

// PUT /api/config - save full config
router.put('/', (req: Request, res: Response) => {
  const config: PlexArrConfig = req.body;
  const errors = validateConfig(config);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  saveConfig(config);
  res.json({ status: 'saved' });
});

// POST /api/config/validate - validate without saving
router.post('/validate', (req: Request, res: Response) => {
  const errors = validateConfig(req.body);
  res.json({ valid: errors.length === 0, errors });
});

// POST /api/config/check-path - check if a host path exists and is writable
router.post('/check-path', (req: Request, res: Response) => {
  const { path: hostPath } = req.body;
  try {
    const stat = fs.statSync(hostPath);
    const writable = (() => { 
      try { 
        fs.accessSync(hostPath, fs.constants.W_OK); 
        return true; 
      } catch { 
        return false; 
      } 
    })();
    res.json({ exists: true, isDirectory: stat.isDirectory(), writable });
  } catch {
    res.json({ exists: false, isDirectory: false, writable: false });
  }
});

export default router;
