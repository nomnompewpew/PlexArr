// Deploy routes with preview, execute, and status

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { generateCompose } from '../services/compose-generator';
import { PlexArrConfig } from '../models/config';
import { runCoordination } from '../services/coordinator';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import StackManager from '../services/stack-manager.service';

const execAsync = promisify(exec);
const router = Router();

// Stack manager instance (will be initialized based on config)
let stackManager: StackManager;

// Rate limiting for deployment endpoints - more restrictive
const deployLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 deployment operations per windowMs
  message: 'Too many deployment requests from this IP, please try again later.'
});

// Apply rate limiting to execute and coordinate endpoints only
router.post('/execute', deployLimiter);
router.post('/coordinate', deployLimiter);

// POST /api/deploy/preview - return generated compose YAML
router.post('/preview', (req: Request, res: Response) => {
  const config: PlexArrConfig = req.body;
  const yaml = generateCompose(config);
  res.type('text/yaml').send(yaml);
});

// POST /api/deploy-new/execute - write compose file and deploy stack using StackManager
router.post('/execute', async (req: Request, res: Response) => {
  const config: PlexArrConfig = req.body;
  const yamlContent = generateCompose(config);

  try {
    // Initialize stack manager with projectFolder from config
    const projectFolder = config.system?.projectFolder || '/opt/plexarr';
    stackManager = new StackManager(projectFolder);

    // Validate the stacks directory
    const validation = await stackManager.validateStacksDir();
    if (!validation.exists) {
      return res.status(400).json({
        success: false,
        message: `Project folder ${projectFolder} does not exist on host`,
        validation,
      });
    }
    if (!validation.writable) {
      return res.status(400).json({
        success: false,
        message: `Project folder ${projectFolder} is not writable`,
        validation,
      });
    }

    // Save compose file to host-mounted stack directory
    await stackManager.saveComposeFile(yamlContent);
    console.log(`[Deploy] Saved compose file to: ${stackManager.getComposePath()}`);

    // Create service directories
    await stackManager.createServiceDirectories(config);

    // Deploy the stack
    const result = await stackManager.deploy();

    if (result.exitCode !== 0) {
      return res.status(500).json({
        success: false,
        message: 'Deployment failed',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      });
    }

    res.json({
      success: true,
      composePath: stackManager.getComposePath(),
      stackPath: stackManager.getStackPath(),
      stdout: result.stdout,
      stderr: result.stderr,
      message: 'Stack deployed successfully',
    });
  } catch (err: any) {
    console.error('[Deploy] Error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      stderr: err.stderr,
    });
  }
});

// GET /api/deploy-new/status - check container health using StackManager
router.get('/status', async (_req: Request, res: Response) => {
  try {
    if (!stackManager) {
      // Initialize with default if not already done
      stackManager = new StackManager();
    }

    const status = await stackManager.getStatus();
    res.json(status);
  } catch (err: any) {
    res.json({ 
      name: 'plexarr-stack',
      status: 'unknown',
      containers: [], 
      error: err.message 
    });
  }
});

// GET /api/deploy-new/logs/:serviceName - get logs for a specific service
router.get('/logs/:serviceName', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;
    const tail = parseInt(req.query.tail as string) || 100;

    if (!stackManager) {
      stackManager = new StackManager();
    }

    const result = await stackManager.getLogs(serviceName, tail, false);

    if (result.exitCode !== 0) {
      return res.status(404).json({
        success: false,
        message: `Service ${serviceName} not found or not running`,
        stderr: result.stderr,
      });
    }

    res.json({
      success: true,
      serviceName,
      logs: result.stdout,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET /api/deploy-new/logs - get logs for all services in stack
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const tail = parseInt(req.query.tail as string) || 100;

    if (!stackManager) {
      stackManager = new StackManager();
    }

    const result = await stackManager.getAllLogs(tail);

    res.json({
      success: true,
      logs: result.stdout,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// POST /api/deploy-new/control/:action - control stack (start/stop/restart)
router.post('/control/:action', async (req: Request, res: Response) => {
  try {
    const { action } = req.params;

    if (!stackManager) {
      stackManager = new StackManager();
    }

    let result;
    switch (action) {
      case 'start':
        result = await stackManager.start();
        break;
      case 'stop':
        result = await stackManager.stop();
        break;
      case 'restart':
        result = await stackManager.restart();
        break;
      case 'down':
        result = await stackManager.down(false);
        break;
      case 'pull':
        result = await stackManager.pull();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown action: ${action}. Valid actions: start, stop, restart, down, pull`,
        });
    }

    if (result.exitCode !== 0) {
      return res.status(500).json({
        success: false,
        message: `Failed to ${action} stack`,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      });
    }

    res.json({
      success: true,
      action,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
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
