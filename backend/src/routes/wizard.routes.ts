import { Router, Request, Response } from 'express';
import { WizardStep } from '../models/config.model';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/wizard/steps - Get all wizard steps with descriptions
 */
router.get('/steps', (req: Request, res: Response) => {
  const steps = [
    {
      id: WizardStep.WELCOME,
      title: 'Welcome to PlexArr',
      description: 'Get started with your unified Plex media server setup',
      order: 1
    },
    {
      id: WizardStep.SYSTEM,
      title: 'System Configuration',
      description: 'Configure basic system settings like timezone and user permissions',
      order: 2,
      fields: [
        { name: 'timezone', label: 'Timezone', type: 'select', required: true, help: 'Select your timezone (e.g., America/New_York, Europe/London)' },
        { name: 'puid', label: 'User ID (PUID)', type: 'number', required: true, default: 1000, help: 'Linux user ID for file permissions. Run "id -u" to find yours.' },
        { name: 'pgid', label: 'Group ID (PGID)', type: 'number', required: true, default: 1000, help: 'Linux group ID for file permissions. Run "id -g" to find yours.' }
      ]
    },
    {
      id: WizardStep.NETWORK,
      title: 'Network Configuration',
      description: 'Configure network settings and external access',
      order: 3,
      fields: [
        { name: 'publicIp', label: 'Public IP Address', type: 'text', required: false, help: 'Your public IP address for external access. Leave empty if not using VPN or external access.' },
        { name: 'publicDomain', label: 'Public Domain', type: 'text', required: false, help: 'Your domain name (optional, for reverse proxy setup)' }
      ]
    },
    {
      id: WizardStep.PATHS,
      title: 'Storage Paths',
      description: 'Configure where your media and downloads will be stored',
      order: 4,
      help: 'Important: All paths should be absolute paths on your host system. Create these directories before proceeding.'
    },
    {
      id: WizardStep.SERVICES,
      title: 'Select Services',
      description: 'Choose which services you want to enable',
      order: 5
    },
    {
      id: WizardStep.NGINX_PROXY,
      title: 'Nginx Proxy Manager',
      description: 'Configure reverse proxy for external access with SSL',
      order: 6,
      optional: true
    },
    {
      id: WizardStep.PLEX,
      title: 'Plex Media Server',
      description: 'Configure your Plex media server',
      order: 7
    },
    {
      id: WizardStep.ARR_APPS,
      title: 'Arr Applications',
      description: 'Configure Radarr, Sonarr, Lidarr, and Prowlarr',
      order: 8
    },
    {
      id: WizardStep.DOWNLOAD_CLIENTS,
      title: 'Download Clients',
      description: 'Configure NZBGet for downloading',
      order: 9
    },
    {
      id: WizardStep.EXTRAS,
      title: 'Extra Services',
      description: 'Configure Overseerr, Maintainerr, WireGuard, and Lidify',
      order: 10,
      optional: true
    },
    {
      id: WizardStep.REVIEW,
      title: 'Review Configuration',
      description: 'Review your configuration before deployment',
      order: 11
    },
    {
      id: WizardStep.DEPLOY,
      title: 'Deploy',
      description: 'Deploy your PlexArr stack',
      order: 12
    }
  ];

  res.json({ steps });
});

/**
 * GET /api/wizard/timezones - Get list of common timezones
 */
router.get('/timezones', (req: Request, res: Response) => {
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'UTC'
  ];

  res.json({ timezones });
});

/**
 * POST /api/wizard/validate-path - Validate a file system path
 */
router.post('/validate-path', (req: Request, res: Response) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ valid: false, message: 'Path is required' });
    }

    // Basic validation
    if (!path.startsWith('/')) {
      return res.json({ 
        valid: false, 
        message: 'Path must be absolute (start with /)' 
      });
    }

    // More validation could be added here (check if directory exists, permissions, etc.)
    
    res.json({ 
      valid: true, 
      message: 'Path looks good! Make sure this directory exists on your system.' 
    });
  } catch (error) {
    console.error('Error validating path:', error);
    res.status(500).json({ error: 'Failed to validate path' });
  }
});

/**
 * POST /api/wizard/hash-password - Generate bcrypt hash for WireGuard password
 */
router.post('/hash-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const hash = await bcrypt.hash(password, 10);

    res.json({ hash });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Failed to hash password' });
  }
});

/**
 * GET /api/wizard/defaults - Get default configuration values
 */
router.get('/defaults', (req: Request, res: Response) => {
  const defaults = {
    system: {
      timezone: 'UTC',
      puid: 1000,
      pgid: 1000
    },
    services: {
      nginxProxyManager: {
        enabled: false,
        adminPort: 81,
        httpPort: 80,
        httpsPort: 443
      },
      radarr: {
        enabled: true,
        port: 7878
      },
      sonarr: {
        enabled: true,
        port: 8989
      },
      prowlarr: {
        enabled: true,
        port: 9696
      },
      lidarr: {
        enabled: true,
        port: 8686
      },
      plex: {
        enabled: true,
        useGpu: false
      },
      overseerr: {
        enabled: true,
        port: 5055,
        logLevel: 'info'
      },
      nzbget: {
        enabled: true,
        port: 6789
      },
      nzbget2: {
        enabled: false,
        port: 6790
      },
      wgEasy: {
        enabled: false,
        uiPort: 51821
      },
      lidify: {
        enabled: false,
        port: 5000
      },
      maintainerr: {
        enabled: true,
        port: 6246
      }
    }
  };

  res.json({ defaults });
});

export default router;
