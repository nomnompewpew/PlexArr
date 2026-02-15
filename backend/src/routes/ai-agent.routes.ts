// AI Agent API routes for configuration assistance

import { Router, Request, Response } from 'express';
import { AIAgentService } from '../services/ai-agent.service';

const router = Router();

// Analyze current configuration
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const config = req.body.config;
    if (!config) {
      return res.status(400).json({ error: 'Configuration is required' });
    }

    if (!config.aiAgent?.enabled) {
      return res.status(400).json({ error: 'AI Agent is not enabled' });
    }

    const aiService = new AIAgentService(config.aiAgent);
    const analysis = await aiService.analyzeConfiguration(config);

    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing configuration:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze configuration' });
  }
});

// Suggest indexers for Prowlarr
router.post('/suggest-indexers', async (req: Request, res: Response) => {
  try {
    const config = req.body.config;
    if (!config) {
      return res.status(400).json({ error: 'Configuration is required' });
    }

    if (!config.aiAgent?.enabled) {
      return res.status(400).json({ error: 'AI Agent is not enabled' });
    }

    const aiService = new AIAgentService(config.aiAgent);
    const suggestions = await aiService.suggestIndexers(config);

    res.json(suggestions);
  } catch (error: any) {
    console.error('Error suggesting indexers:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest indexers' });
  }
});

// Suggest quality profiles for a service
router.post('/suggest-quality-profiles', async (req: Request, res: Response) => {
  try {
    const { config, service } = req.body;
    if (!config || !service) {
      return res.status(400).json({ error: 'Configuration and service name are required' });
    }

    if (!config.aiAgent?.enabled) {
      return res.status(400).json({ error: 'AI Agent is not enabled' });
    }

    const aiService = new AIAgentService(config.aiAgent);
    const suggestions = await aiService.suggestQualityProfiles(service);

    res.json(suggestions);
  } catch (error: any) {
    console.error('Error suggesting quality profiles:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest quality profiles' });
  }
});

// Troubleshoot connection issues
router.post('/troubleshoot', async (req: Request, res: Response) => {
  try {
    const { config, sourceService, targetService, error } = req.body;
    if (!config || !sourceService || !targetService || !error) {
      return res.status(400).json({ 
        error: 'config, sourceService, targetService, and error are required' 
      });
    }

    if (!config.aiAgent?.enabled) {
      return res.status(400).json({ error: 'AI Agent is not enabled' });
    }

    const aiService = new AIAgentService(config.aiAgent);
    const troubleshooting = await aiService.troubleshootConnection(
      sourceService,
      targetService,
      error
    );

    res.json(troubleshooting);
  } catch (error: any) {
    console.error('Error troubleshooting:', error);
    res.status(500).json({ error: error.message || 'Failed to troubleshoot' });
  }
});

export default router;
