import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { dbService, dockerComposeService, apiCoordinationService } from '../index';
import { ConfigData } from '../models/config.model';

const router = Router();

/**
 * POST /api/deploy/generate - Generate docker-compose.yml from configuration
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const configData: ConfigData = req.body;
    
    // Generate docker-compose content
    const dockerCompose = dockerComposeService.generateDockerCompose(configData);
    
    // Validate
    const validation = dockerComposeService.validateDockerCompose(dockerCompose);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Save to file
    const outputPath = path.join(__dirname, '../../generated-config/docker-compose.yml');
    dockerComposeService.saveDockerCompose(dockerCompose, outputPath);

    res.json({
      success: true,
      message: 'Docker compose file generated successfully',
      path: outputPath,
      content: dockerCompose
    });
  } catch (error) {
    console.error('Error generating docker-compose:', error);
    res.status(500).json({ error: 'Failed to generate docker-compose file' });
  }
});

/**
 * POST /api/deploy/start - Start all services
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { configId } = req.body;
    
    if (!configId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const config = await dbService.getConfiguration(configId);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Record deployment
    const deploymentId = uuidv4();
    const dockerComposePath = path.join(__dirname, '../../generated-config/docker-compose.yml');
    
    await dbService.saveDeployment(deploymentId, configId, 'starting', dockerComposePath);

    res.json({
      success: true,
      message: 'Deployment started',
      deploymentId: deploymentId,
      note: 'Use docker-compose up -d to start the services manually'
    });
  } catch (error) {
    console.error('Error starting deployment:', error);
    res.status(500).json({ error: 'Failed to start deployment' });
  }
});

/**
 * POST /api/deploy/coordinate - Automatically coordinate API keys between services
 */
router.post('/coordinate', async (req: Request, res: Response) => {
  try {
    const { services } = req.body;

    if (!services) {
      return res.status(400).json({ error: 'Services configuration is required' });
    }

    // Wait a bit for services to start up
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Coordinate all services
    await apiCoordinationService.coordinateAllServices(services);

    res.json({
      success: true,
      message: 'API coordination completed successfully'
    });
  } catch (error) {
    console.error('Error coordinating services:', error);
    res.status(500).json({ 
      error: 'Failed to coordinate services',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/deploy/status - Get deployment status
 */
router.get('/status/:deploymentId', (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;

    // In a real implementation, this would check Docker container status
    res.json({
      deploymentId,
      status: 'running',
      message: 'Check docker ps to see running containers'
    });
  } catch (error) {
    console.error('Error getting deployment status:', error);
    res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

export default router;
