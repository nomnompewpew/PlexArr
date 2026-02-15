/**
 * Stack Manager Service
 * 
 * Manages Docker Compose stacks similar to Dockge's architecture:
 * - Stores compose files on host filesystem (mounted volume)
 * - Executes docker compose commands with proper context
 * - Streams real-time terminal output
 * - Provides container status and logs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PlexArrConfig } from '../models/config';

const execAsync = promisify(exec);

export interface ContainerStatus {
  name: string;
  service: string;
  state: string;
  status: string;
  health?: string;
  ports: string[];
}

export interface StackStatus {
  name: string;
  status: 'unknown' | 'created' | 'running' | 'exited' | 'stopped';
  containers: ContainerStatus[];
}

export class StackManager {
  private stacksDir: string;
  private stackName: string = 'plexarr-stack';

  constructor(stacksDir?: string) {
    this.stacksDir = stacksDir || process.env.STACKS_DIR || '/opt/plexarr';
  }

  /**
   * Get the full path to the stack's directory on the host (mounted in container)
   */
  getStackPath(): string {
    return path.join(this.stacksDir, this.stackName);
  }

  /**
   * Get the full path to the compose file
   */
  getComposePath(): string {
    return path.join(this.getStackPath(), 'compose.yml');
  }

  /**
   * Ensure the stack directory exists on the host
   */
  async ensureStackDirectory(): Promise<void> {
    const stackPath = this.getStackPath();
    try {
      await fs.access(stackPath);
    } catch {
      await fs.mkdir(stackPath, { recursive: true });
    }
  }

  /**
   * Save the compose file to the stack directory on the host
   */
  async saveComposeFile(composeYaml: string): Promise<void> {
    await this.ensureStackDirectory();
    const composePath = this.getComposePath();
    await fs.writeFile(composePath, composeYaml, 'utf-8');
  }

  /**
   * Read the compose file from the stack directory
   */
  async readComposeFile(): Promise<string | null> {
    try {
      const composePath = this.getComposePath();
      return await fs.readFile(composePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Check if the compose file exists
   */
  async composeFileExists(): Promise<boolean> {
    try {
      await fs.access(this.getComposePath());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a docker compose command in the stack directory
   * Returns { stdout, stderr, exitCode }
   */
  private async executeCompose(
    command: string,
    args: string[] = []
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const composePath = this.getComposePath();
    const stackPath = this.getStackPath();

    // Build the full command
    const fullCommand = `docker compose -f ${composePath} ${command} ${args.join(' ')}`;

    console.log(`[StackManager] Executing: ${fullCommand}`);
    console.log(`[StackManager] CWD: ${stackPath}`);

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: stackPath,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  /**
   * Create the external network if it doesn't exist
   */
  async ensureNetwork(networkName: string = 'plexarr_default'): Promise<void> {
    try {
      // Check if network exists
      const { stdout } = await execAsync(
        `docker network inspect ${networkName}`
      );
      console.log(`[StackManager] Network ${networkName} already exists`);
    } catch {
      // Network doesn't exist, create it
      console.log(`[StackManager] Creating network ${networkName}...`);
      await execAsync(`docker network create ${networkName}`);
    }
  }

  /**
   * Deploy the stack (docker compose up -d)
   */
  async deploy(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    await this.ensureNetwork();
    return await this.executeCompose('up', ['-d', '--remove-orphans']);
  }

  /**
   * Stop the stack (docker compose stop)
   */
  async stop(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return await this.executeCompose('stop');
  }

  /**
   * Start the stack (docker compose start)
   */
  async start(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return await this.executeCompose('start');
  }

  /**
   * Restart the stack (docker compose restart)
   */
  async restart(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return await this.executeCompose('restart');
  }

  /**
   * Tear down the stack (docker compose down)
   */
  async down(
    removeVolumes: boolean = false
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const args = ['--remove-orphans'];
    if (removeVolumes) {
      args.push('-v');
    }
    return await this.executeCompose('down', args);
  }

  /**
   * Pull updated images (docker compose pull)
   */
  async pull(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return await this.executeCompose('pull');
  }

  /**
   * Get the status of all containers in the stack
   * Uses `docker compose ps --format json`
   */
  async getStatus(): Promise<StackStatus> {
    const result = await this.executeCompose('ps', ['--format', 'json']);

    const containers: ContainerStatus[] = [];

    if (result.exitCode === 0 && result.stdout.trim()) {
      // Parse JSON lines
      const lines = result.stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          containers.push({
            name: data.Name || data.name || '',
            service: data.Service || data.service || '',
            state: data.State || data.state || 'unknown',
            status: data.Status || data.status || '',
            health: data.Health || data.health || undefined,
            ports: this.parsePorts(data.Publishers || data.Ports || ''),
          });
        } catch (e) {
          console.error('[StackManager] Failed to parse container JSON:', e);
        }
      }
    }

    // Determine overall stack status
    let overallStatus: StackStatus['status'] = 'unknown';
    if (containers.length === 0) {
      overallStatus = 'unknown';
    } else if (containers.every((c) => c.state === 'running')) {
      overallStatus = 'running';
    } else if (containers.some((c) => c.state === 'exited')) {
      overallStatus = 'exited';
    } else if (containers.some((c) => c.state === 'created')) {
      overallStatus = 'created';
    }

    return {
      name: this.stackName,
      status: overallStatus,
      containers,
    };
  }

  /**
   * Parse ports from docker compose ps output
   */
  private parsePorts(portsData: any): string[] {
    if (typeof portsData === 'string') {
      // Parse string format like "0.0.0.0:8080->80/tcp"
      return portsData
        .split(/,\s*/)
        .filter((p) => p.includes('->'))
        .map((p) => p.trim());
    } else if (Array.isArray(portsData)) {
      // Parse array format from Publishers
      return portsData
        .filter((p) => p.PublishedPort)
        .map((p) => `${p.URL || '0.0.0.0'}:${p.PublishedPort}->${p.TargetPort}/${p.Protocol || 'tcp'}`);
    }
    return [];
  }

  /**
   * Get logs for a specific service
   */
  async getLogs(
    serviceName: string,
    tail: number = 100,
    follow: boolean = false
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const args = ['--tail', tail.toString()];
    if (follow) {
      args.push('-f');
    }
    args.push(serviceName);

    return await this.executeCompose('logs', args);
  }

  /**
   * Get logs for all services in the stack
   */
  async getAllLogs(
    tail: number = 100
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return await this.executeCompose('logs', ['--tail', tail.toString()]);
  }

  /**
   * Check if the stack directory path is valid on the host
   */
  async validateStacksDir(): Promise<{ valid: boolean; exists: boolean; writable: boolean }> {
    try {
      // Check if the base stacks directory exists
      await fs.access(this.stacksDir, fs.constants.F_OK);
      
      // Check if writable
      await fs.access(this.stacksDir, fs.constants.W_OK);
      
      return { valid: true, exists: true, writable: true };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { valid: true, exists: false, writable: false };
      } else if (error.code === 'EACCES') {
        return { valid: true, exists: true, writable: false };
      }
      return { valid: false, exists: false, writable: false };
    }
  }

  /**
   * Create necessary directories on the host for services
   * This reads the compose file and creates directories for volume mounts
   */
  async createServiceDirectories(config: PlexArrConfig): Promise<void> {
    const directories = new Set<string>();

    // Collect storage paths from config
    if (config.storage.mediaRoot) {
      directories.add(config.storage.mediaRoot);
    }
    if (config.storage.downloads) {
      directories.add(config.storage.downloads);
    }
    if (config.storage.config) {
      directories.add(config.storage.config);
    }

    // Add optional override paths
    if (config.storage.movies) directories.add(config.storage.movies);
    if (config.storage.tv) directories.add(config.storage.tv);
    if (config.storage.music) directories.add(config.storage.music);

    // Create directories using docker exec (since we're in a container)
    for (const dir of directories) {
      try {
        // Use docker to create directories on host with correct permissions
        await execAsync(
          `mkdir -p "${dir}" && chown ${config.system.puid}:${config.system.pgid} "${dir}"`
        );
        console.log(`[StackManager] Created directory: ${dir}`);
      } catch (error) {
        console.error(`[StackManager] Failed to create directory ${dir}:`, error);
      }
    }
  }
}

export default StackManager;
