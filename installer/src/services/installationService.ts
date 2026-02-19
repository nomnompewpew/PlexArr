import { platformAPI } from './platformAPI';
import type { SystemInfo } from '../types/installer';

interface InstallationProgress {
  status: 'downloading' | 'extracting' | 'installing' | 'starting_services' | 'waiting_for_services';
  progress: number; // 0-100
  message: string;
}

/**
 * Service for managing the actual PlexArr installation
 */
export class InstallationService {
  private progressCallback?: (progress: InstallationProgress) => void;
  private passwordCallback?: () => Promise<string>;
  private cachedPassword?: string;
  private logFile = `/tmp/plexarr-install-debug-${Date.now()}.log`;
  private logBuffer: string[] = [];
  private logFlushTimer?: NodeJS.Timeout;

  setProgressCallback(callback: (progress: InstallationProgress) => void) {
    this.progressCallback = callback;
  }

  setPasswordCallback(callback: () => Promise<string>) {
    this.passwordCallback = callback;
  }

  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Batch log writes to avoid overwhelming the system
    this.logBuffer.push(logMessage);
    
    // Flush logs every 500ms or when buffer gets large
    if (this.logBuffer.length >= 10) {
      this.flushLogs();
    } else {
      if (this.logFlushTimer) {
        clearTimeout(this.logFlushTimer);
      }
      this.logFlushTimer = setTimeout(() => this.flushLogs(), 500);
    }
  }

  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;
    
    const logs = this.logBuffer.join('\n');
    this.logBuffer = [];
    
    // Use platformAPI to append logs without waiting
    platformAPI.executeCommand('bash', [
      '-c',
      `echo "${logs.replace(/"/g, '\\"')}" >> ${this.logFile}`
    ]).catch(() => {
      // Ignore log write failures
    });
  }

  private updateProgress(status: InstallationProgress['status'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ status, progress, message });
    }
    // Also log progress updates
    this.log(`PROGRESS: ${progress}% - ${status} - ${message}`).catch(() => {});
  }

  /**
   * Get password from user if needed
   */
  private async getPassword(): Promise<string> {
    if (this.cachedPassword) {
      return this.cachedPassword;
    }

    if (!this.passwordCallback) {
      throw new Error('Password callback not set');
    }

    const password = await this.passwordCallback();
    this.cachedPassword = password;
    return password;
  }

  /**
   * Install PlexArr - main installation entry point
   */
  async installPlexArr(systemInfo: SystemInfo): Promise<void> {
    try {
      await this.log(`=== PlexArr Installation Started ===`);
      await this.log(`Platform: ${systemInfo.platform}, Arch: ${systemInfo.arch}`);
      
      // Step 1: Determine installation path
      this.updateProgress('downloading', 10, 'Preparing installation...');
      const installPath = await this.getInstallationPath(systemInfo);
      await this.log(`Installation path: ${installPath}`);
      
      // Step 2: Pre-authenticate sudo if needed (for non-Windows)
      if (systemInfo.platform !== 'windows') {
        this.updateProgress('downloading', 15, 'Authenticating for installation...');
        await this.log('Starting sudo pre-authentication...');
        await this.authenticateSudo();
        await this.log('Sudo pre-authentication successful');
      }
      
      // Step 3: Get/clone PlexArr source
      this.updateProgress('downloading', 20, 'Cloning PlexArr from GitHub...');
      await this.log('Starting GitHub clone...');
      const sourcePath = await this.getOrClonePlexArr(systemInfo);
      await this.log(`Successfully cloned to: ${sourcePath}`);
      
      // Step 4: Copy files to installation directory
      this.updateProgress('downloading', 40, 'Copying files to installation directory...');
      await this.log(`Starting file copy from ${sourcePath} to ${installPath}...`);
      await this.copyPlexArrFiles(sourcePath, installPath, systemInfo);
      await this.log('File copy complete');
      
      // Step 5: Fix permissions and docker group
      this.updateProgress('installing', 50, 'Configuring permissions...');
      await this.log('Starting permissions fix...');
      await this.fixPermissions(installPath, systemInfo);
      await this.log('Permissions fix complete');
      
      // Step 6: Build and start services
      this.updateProgress('starting_services', 65, 'Building Docker images and starting services...');
      await this.log('Starting docker compose up...');
      await this.startPlexArrServices(installPath, systemInfo);
      await this.log('Docker compose command executed');
      
      // Step 7: Wait for services to be healthy
      this.updateProgress('waiting_for_services', 85, 'Waiting for services to become healthy...');
      await this.log('Waiting for services to start (10 minute timeout)...');
      await this.waitForServices(10 * 60 * 1000);
      await this.log('Services are healthy!');
      
      // Complete
      this.updateProgress('waiting_for_services', 100, 'Installation complete!');
      await this.log(`=== Installation Complete ===`);
      await this.log(`Log file: ${this.logFile}`);
      this.flushLogs(); // Ensure all logs are written
    } catch (error) {
      await this.log(`ERROR: ${error}`);
      this.flushLogs(); // Ensure error is logged
      throw new Error(`Installation failed: ${error}`);
    }
  }

  /**
   * Authenticate sudo once to cache credentials
   */
  private async authenticateSudo(): Promise<void> {
    try {
      // First try non-interactive sudo (might already be cached)
      await this.log('Attempting non-interactive sudo (sudo -n true)...');
      await platformAPI.executeCommand('sudo', ['-n', 'true']);
      await this.log('Sudo already cached, no password needed');
      return; // Already authenticated
    } catch {
      // Need to authenticate with password
      await this.log('Sudo not cached, requesting password from user...');
      const password = await this.getPassword();
      await this.log('Password received, attempting pre-authentication (sudo -S -v)...');
      
      // Use echo with sudo -S to pass password via stdin
      // The -S flag allows password to be read from standard input
      const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      
      try {
        await platformAPI.executeCommand('bash', ['-c', `echo "${escapedPassword}" | sudo -S -v`]);
        await this.log('Sudo pre-authentication successful!');
      } catch (err) {
        await this.log(`Sudo pre-authentication failed: ${err}`);
        throw new Error(`Failed to authenticate with sudo: ${err}`);
      }
    }
  }

  /**
   * Determine the installation path based on OS
   */
  private async getInstallationPath(systemInfo: SystemInfo): Promise<string> {
    if (systemInfo.platform === 'windows') {
      return 'C:\\PlexArr';
    } else if (systemInfo.platform === 'darwin') {
      return '/Applications/PlexArr';
    } else {
      // Linux
      return '/opt/plexarr';
    }
  }

  /**
   * Get PlexArr source - clone from GitHub
   */
  private async getOrClonePlexArr(_systemInfo: SystemInfo): Promise<string> {
    const clonePath = '/tmp/plexarr-clone';
    
    // Always do a fresh clone - remove old clone if it exists
    try {
      await this.log(`Removing old clone directory: ${clonePath}...`);
      await platformAPI.executeCommand('rm', ['-rf', clonePath]);
      await this.log('Old clone directory removed');
    } catch {
      // Directory might not exist, that's fine
      await this.log('No old clone directory to remove');
    }

    // Clone from GitHub
    try {
      await this.log('Cloning PlexArr from GitHub (nomnompewpew/PlexArr)...');
      const result = await platformAPI.executeCommand('git', ['clone', '--depth', '1', 'https://github.com/nomnompewpew/PlexArr.git', clonePath]);
      await this.log(`Git clone completed: ${result}`);
      return clonePath;
    } catch (error) {
      await this.log(`Git clone failed: ${error}`);
      throw new Error(`Failed to clone PlexArr from GitHub: ${error}`);
    }
  }

  /**
   * Copy PlexArr files to the installation directory (/opt/plexarr)
   */
  private async copyPlexArrFiles(sourcePath: string, installPath: string, systemInfo: SystemInfo): Promise<void> {
    if (systemInfo.platform === 'windows') {
      // Windows: Create directory and copy
      try {
        await platformAPI.executeCommand('cmd', ['/c', `mkdir "${installPath}" 2>nul`]);
      } catch {
        // Directory may exist
      }

      await platformAPI.executeCommand('cmd', ['/c', `xcopy "${sourcePath}" "${installPath}" /E /I /Y`]);
      return;
    }

    // For Linux/macOS, we need to handle permissions properly
    const username = await platformAPI.executeCommand('whoami', []);
    const user = username.trim();

    // STEP 0: Stop any existing PlexArr containers if they're running
    try {
      await this.log('Checking for existing PlexArr containers...');
      const psOutput = await platformAPI.executeCommand('docker', ['ps', '--filter', 'name=plexarr', '--format', '{{.Names}}']);
      
      if (psOutput && psOutput.toLowerCase().includes('plexarr')) {
        await this.log('Found existing PlexArr containers, stopping them...');
        try {
          await platformAPI.executeCommand('docker', ['stop', '-t', '10', 'plexarr-backend', 'plexarr-frontend']);
          await this.log('Stopped existing PlexArr containers');
        } catch (err) {
          await this.log(`Warning: Could not stop containers: ${err}`);
        }
      } else {
        await this.log('No existing PlexArr containers found');
      }
    } catch (err) {
      await this.log(`Could not check for existing containers: ${err}`);
    }

    // Clean up old installation directory with sudo
    try {
      await this.log(`Checking if old installation exists at ${installPath}...`);
      await platformAPI.executeCommand('test', ['-d', installPath]);
      // Directory exists, remove it with sudo
      await this.log(`Removing old installation at ${installPath}...`);
      await this.runSudoCommand('rm', ['-rf', installPath]);
      await this.log(`Old installation removed`);
    } catch {
      // Directory doesn't exist, that's fine
      await this.log(`No old installation found, starting fresh`);
    }

    // Step 1: Create the installation directory with proper ownership (using sudo)
    try {
      await this.log(`Creating new installation directory: ${installPath}...`);
      // Create directory
      await this.runSudoCommand('mkdir', ['-p', installPath]);
      // Change ownership to current user
      await this.runSudoCommand('chown', [user, installPath]);
      // Make it readable
      await this.runSudoCommand('chmod', ['755', installPath]);
      await this.log('Installation directory created and configured');
    } catch (error) {
      await this.log(`Failed to prepare installation directory: ${error}`);
      throw new Error(`Failed to prepare installation directory: ${error}`);
    }

    // Step 2: Copy files (as user, no sudo needed since we own the directory)
    try {
      await this.log('Copying PlexArr files...');
      // Use rsync if available, otherwise cp
      try {
        await platformAPI.executeCommand('rsync', ['-av', '--delete', sourcePath + '/', installPath + '/']);
        await this.log('File copy completed with rsync');
      } catch {
        // Fallback to cp
        await this.log('rsync not available, falling back to cp...');
        await platformAPI.executeCommand('cp', ['-r', sourcePath + '/.', installPath + '/']);
        await this.log('File copy completed with cp');
      }
    } catch (error) {
      await this.log(`Failed to copy PlexArr files: ${error}`);
      throw new Error(`Failed to copy PlexArr files: ${error}`);
    }
  }

  /**
   * Helper to run sudo commands (password cached from pre-authentication)
   */
  private async runSudoCommand(command: string, args: string[]): Promise<string> {
    // For non-TTY environments (like double-clicking from file manager),
    // we must explicitly pass the password via stdin with sudo -S
    const password = await this.getPassword();
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    // Construct the command with password piped to sudo
    const argsStr = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');
    const fullCmd = `echo "${escapedPassword}" | sudo -S ${command} ${argsStr}`;
    
    return await platformAPI.executeCommand('bash', ['-c', fullCmd]);
  }

  /**
   * Fix permissions for the installation directory
   */
  private async fixPermissions(installPath: string, systemInfo: SystemInfo): Promise<void> {
    if (systemInfo.platform === 'windows') {
      // Windows permissions handled by Windows ACLs, skip
      return;
    }

    try {
      // Get current username
      const username = await platformAPI.executeCommand('whoami', []);
      const user = username.trim();

      // Make the directory world-readable for docker
      await this.runSudoCommand('chmod', ['-R', '755', installPath]);

      // Ensure current user owns it
      await this.runSudoCommand('chown', ['-R', `${user}:${user}`, installPath]);
    } catch (error) {
      // Permissions issue, but continue - docker might still work
      console.warn(`Permission adjustment issue: ${error}`);
    }
  }

  /**
   * Start PlexArr services using docker compose (modern syntax)
   */
  private async startPlexArrServices(installPath: string, systemInfo: SystemInfo): Promise<void> {
    // Determine the docker-compose file path
    const composeFile = systemInfo.platform === 'windows'
      ? `${installPath}\\docker-compose.yml`
      : `${installPath}/docker-compose.yml`;

    await this.log(`Docker compose file path: ${composeFile}`);

    // Verify docker-compose file exists
    try {
      await this.log('Verifying docker-compose.yml exists...');
      await platformAPI.executeCommand('test', ['-f', composeFile]);
      await this.log('docker-compose.yml found!');
    } catch {
      await this.log(`docker-compose.yml NOT found at: ${composeFile}`);
      throw new Error('docker-compose.yml not found in installation directory');
    }

    // Run 'docker compose up --build' in background
    // Use nohup to truly background the process so it doesn't block
    try {
      // Try without sudo first
      await this.log('Attempting docker compose without sudo...');
      const result = await platformAPI.executeCommand('nohup', ['docker', 'compose', '-f', composeFile, 'up', '--build', '-d']);
      await this.log(`Docker compose started (no sudo needed): ${result}`);
    } catch {
      // If that fails, try with sudo
      try {
        await this.log('Docker compose without sudo failed, trying with sudo...');
        const password = await this.getPassword();
        const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        const result = await platformAPI.executeCommand('bash', ['-c', `echo "${escapedPassword}" | sudo -S nohup docker compose -f ${composeFile} up --build -d > /dev/null 2>&1 &`]);
        await this.log(`Docker compose started (with sudo): ${result}`);
      } catch (err) {
        await this.log(`Failed to start Docker services: ${err}`);
        throw new Error(`Failed to start Docker services: ${err}`);
      }
    }
  }

  /**
   * Wait for PlexArr services to be healthy
   */
  private async waitForServices(timeout: number): Promise<void> {
    const checkInterval = 5000; // Check every 5 seconds
    const maxAttempts = Math.ceil(timeout / checkInterval);
    let attempts = 0;

    await this.log(`Starting service health check (timeout: ${timeout}ms, ${maxAttempts} attempts every ${checkInterval}ms)...`);

    while (attempts < maxAttempts) {
      try {
        // Check if plexarr-backend container is running (primary service)
        const psOutput = await platformAPI.executeCommand('docker', ['ps', '--filter', 'name=plexarr-backend', '--format', '{{.Names}}']);

        if (psOutput && psOutput.toLowerCase().includes('plexarr-backend')) {
          await this.log(`Container plexarr-backend found! Output: "${psOutput.trim()}"`);
          // Backend is running, wait a moment for frontend to start too
          await this.log('Waiting 2 seconds for frontend container to start...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.log('Services are healthy!');
          return;
        } else {
          await this.log(`Attempt ${attempts + 1}/${maxAttempts}: plexarr-backend not running yet. Output: "${psOutput?.trim() || '(empty)'}"`);
        }
      } catch (err) {
        // docker command failed, wait and try again
        await this.log(`Attempt ${attempts + 1}/${maxAttempts}: docker ps check failed: ${err}`);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    await this.log(`ERROR: Services did not start within ${timeout}ms (${maxAttempts} attempts)`);
    throw new Error('Services did not start within timeout period');
  }
}

export const installationService = new InstallationService();
