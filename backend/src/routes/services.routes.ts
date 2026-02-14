// Service connectivity testing routes

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const SERVICE_HEALTH: Record<string, (port: number) => { url: string; validate: (data: any) => boolean }> = {
  plex:     (port) => ({ url: `http://localhost:${port}/identity`, validate: (d) => !!d?.MediaContainer }),
  radarr:   (port) => ({ url: `http://localhost:${port}/api/v3/system/status`, validate: () => true }),
  sonarr:   (port) => ({ url: `http://localhost:${port}/api/v3/system/status`, validate: () => true }),
  lidarr:   (port) => ({ url: `http://localhost:${port}/api/v1/system/status`, validate: () => true }),
  prowlarr: (port) => ({ url: `http://localhost:${port}/api/v1/system/status`, validate: () => true }),
  overseerr:(port) => ({ url: `http://localhost:${port}/api/v1/status`,        validate: () => true }),
  nzbget:   (port) => ({ url: `http://localhost:${port}/jsonrpc/version`,      validate: () => true }),
  maintainerr: (port) => ({ url: `http://localhost:${port}/api/status`,        validate: () => true }),
};

router.post('/test', async (req: Request, res: Response) => {
  const { service, port, apiKey } = req.body;

  const check = SERVICE_HEALTH[service];
  if (!check) {
    return res.json({ success: false, message: `Unknown service: ${service}` });
  }

  const { url, validate } = check(port);
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers['X-Api-Key'] = apiKey;

    const response = await axios.get(url, { headers, timeout: 5000 });
    const valid = validate(response.data);
    res.json({ success: valid, message: valid ? 'Connected' : 'Unexpected response' });
  } catch (err: any) {
    const msg = err.code === 'ECONNREFUSED'
      ? 'Connection refused — service may not be running yet'
      : err.message;
    res.json({ success: false, message: msg });
  }
});

export default router;
