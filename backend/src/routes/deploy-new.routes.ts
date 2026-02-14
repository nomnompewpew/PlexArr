// Deploy routes with preview, execute, and status

import { Router, Request, Response } from 'express';
import { generateCompose } from '../services/compose-generator';
import { PlexArrConfig } from '../models/config';
import { runCoordination } from '../services/coordinator';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const router = Router();

const OUTPUT_DIR = path.join(process.cwd(), 'generated-config');
const COMPOSE_PATH = path.join(OUTPUT_DIR, 'docker-compose.yml');

// POST /api/deploy/preview - return generated compose YAML
router.post('/preview', (req: Request, res: Response) => {
  const config: PlexArrConfig = req.body;
  const yaml = generateCompose(config);
  res.type('text/yaml').send(yaml);
});

// POST /api/deploy/execute - write compose file and run docker compose up
router.post('/execute', async (req: Request, res: Response) => {
  const config: PlexArrConfig = req.body;
  const yamlContent = generateCompose(config);

  try {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(COMPOSE_PATH, yamlContent);

    // Ensure network exists
    try {
      await execAsync('docker network create plexarr_default');
    } catch { /* already exists */ }

    // Create storage directories
    for (const p of Object.values(config.storage)) {
      if (typeof p === 'string' && p.startsWith('/')) {
        try { fs.mkdirSync(p, { recursive: true }); } catch { /* ignore */ }
      }
    }

    // Deploy
    const { stdout, stderr } = await execAsync(
      `docker compose -f ${COMPOSE_PATH} up -d`,
      { timeout: 120000 }
    );

    res.json({
      success: true,
      composePath: COMPOSE_PATH,
      stdout,
      stderr,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      stderr: err.stderr,
    });
  }
});

// GET /api/deploy/status - check container health
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync(
      `docker compose -f ${COMPOSE_PATH} ps --format json`
    );
    const containers = stdout.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    res.json({ containers });
  } catch (err: any) {
    res.json({ containers: [], error: err.message });
  }
});

// POST /api/deploy/coordinate - run service coordination
router.post('/coordinate', async (req: Request, res: Response) => {
  try {
    const { configBasePath } = req.body;
    const configPath = configBasePath || path.join(process.cwd(), 'data');
    const results = await runCoordination(configPath);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
