import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../index';
import { Configuration, ConfigData } from '../models/config.model';

const router = Router();

/**
 * GET /api/config - Get current configuration
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const config = dbService.getCurrentConfiguration();
    
    if (!config) {
      return res.json({
        exists: false,
        message: 'No configuration found. Please complete the setup wizard.'
      });
    }

    res.json({
      exists: true,
      config: {
        id: config.id,
        created_at: config.created_at,
        updated_at: config.updated_at,
        setup_completed: config.setup_completed,
        data: JSON.parse(config.config_data)
      }
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

/**
 * POST /api/config - Save configuration
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const configData: ConfigData = req.body;
    
    const now = new Date().toISOString();
    const config: Configuration = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      setup_completed: false,
      config_data: JSON.stringify(configData)
    };

    dbService.saveConfiguration(config);

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      config_id: config.id
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

/**
 * PUT /api/config/:id - Update configuration
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const configData: ConfigData = req.body;
    
    const existing = dbService.getConfiguration(id);
    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    const config: Configuration = {
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
      setup_completed: req.body.setup_completed || existing.setup_completed,
      config_data: JSON.stringify(configData)
    };

    dbService.saveConfiguration(config);

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * GET /api/config/api-keys - Get all API keys
 */
router.get('/api-keys', (req: Request, res: Response) => {
  try {
    const apiKeys = dbService.getAllApiKeys();
    res.json({ apiKeys });
  } catch (error) {
    console.error('Error getting API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

/**
 * POST /api/config/api-keys/:service - Save API key for a service
 */
router.post('/api-keys/:service', (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    dbService.saveApiKey(service, apiKey);

    res.json({
      success: true,
      message: `API key saved for ${service}`
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

export default router;
