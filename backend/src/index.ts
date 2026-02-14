import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './services/database.service';
import { DockerComposeService } from './services/docker-compose.service';
import { ApiCoordinationService } from './services/api-coordination.service';
import configRouter from './routes/config.routes';
import deployRouter from './routes/deploy.routes';
import wizardRouter from './routes/wizard.routes';
import configNewRouter from './routes/config-new.routes';
import deployNewRouter from './routes/deploy-new.routes';
import servicesRouter from './routes/services.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/plexarr.db');

// Initialize services
export const dbService = new DatabaseService(DATABASE_PATH);
export const dockerComposeService = new DockerComposeService();
export const apiCoordinationService = new ApiCoordinationService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/config', configRouter);
app.use('/api/deploy', deployRouter);
app.use('/api/wizard', wizardRouter);
// New roadmap routes
app.use('/api/config-new', configNewRouter);
app.use('/api/deploy-new', deployNewRouter);
app.use('/api/services', servicesRouter);

// Welcome endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'PlexArr API - Unified Plex and Arr Management',
    version: '1.0.0',
    endpoints: {
      config: '/api/config',
      deploy: '/api/deploy',
      wizard: '/api/wizard'
    }
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   PlexArr API Server                                  ║
║   Unified Plex and Arr Management                     ║
║                                                       ║
║   Server running on port ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                       ║
║   API: http://localhost:${PORT}/api                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database...');
  dbService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing database...');
  dbService.close();
  process.exit(0);
});

export default app;
