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
    await this.log(`Starting Docker services from: ${installPath}`);

    // Verify Docker is installed and running
    try {
      await this.log('Checking if Docker is installed and running...');
      const dockerVersion = await platformAPI.executeCommand('docker', ['--version']);
      await this.log(`Docker version: ${dockerVersion.trim()}`);
      
      // Check if Docker daemon is running
      const dockerInfo = await platformAPI.executeCommand('docker', ['info']);
      await this.log('Docker daemon is running');
    } catch (err) {
      await this.log(`ERROR: Docker is not running or not installed: ${err}`);
      throw new Error('Docker is not installed or not running. Please install Docker first.');
    }

    // Verify docker compose works (modern syntax without hyphen)
    try {
      await this.log('Verifying docker compose command...');
      const composeVersion = await platformAPI.executeCommand('docker', ['compose', 'version']);
      await this.log(`Docker Compose version: ${composeVersion.trim()}`);
    } catch (err) {
      await this.log(`ERROR: docker compose command failed: ${err}`);
      throw new Error('Docker Compose is not available. Please ensure Docker Desktop or Compose plugin is installed.');
    }

    // Verify docker-compose.yml exists
    const composeFile = `${installPath}/docker-compose.yml`;
    try {
      await this.log('Verifying docker-compose.yml exists...');
      await platformAPI.executeCommand('test', ['-f', composeFile]);
      await this.log('docker-compose.yml found!');
    } catch {
      await this.log(`ERROR: docker-compose.yml NOT found at: ${composeFile}`);
      throw new Error('docker-compose.yml not found in installation directory');
    }

    // Change to the installation directory and run docker compose
    // This ensures relative paths in docker-compose.yml work correctly
    const cdAndCompose = `cd ${installPath} && docker compose up --build -d`;
    
    try {
      // Try without sudo first
      await this.log('Attempting: docker compose up --build -d (without sudo)...');
      const result = await platformAPI.executeCommand('bash', ['-c', cdAndCompose]);
      await this.log(`Docker compose output: ${result.substring(0, 500)}`);
      await this.log('Docker compose command completed (no sudo needed)');
    } catch (err) {
      // If that fails, try with sudo
      await this.log(`Without sudo failed: ${err}`);
      try {
        await this.log('Attempting with sudo...');
        const password = await this.getPassword();
        const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        const sudoCommand = `echo "${escapedPassword}" | sudo -S bash -c "cd ${installPath} && docker compose up --build -d"`;
        const result = await platformAPI.executeCommand('bash', ['-c', sudoCommand]);
        await this.log(`Docker compose output (sudo): ${result.substring(0, 500)}`);
        await this.log('Docker compose command completed (with sudo)');
      } catch (sudoErr) {
        await this.log(`FATAL: Failed to start Docker services: ${sudoErr}`);
        throw new Error(`Failed to start Docker services: ${sudoErr}`);
      }
    }

    // Give Docker a moment to create containers before we start checking
    await this.log('Waiting 10 seconds for Docker containers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify containers were created
    try {
      const allContainers = await platformAPI.executeCommand('docker', ['ps', '-a', '--format', '{{.Names}}']);
      await this.log(`All Docker containers (after compose): ${allContainers}`);
      
      if (!allContainers.includes('plexarr')) {
        await this.log('WARNING: No plexarr containers found after docker compose!');
        await this.log('Checking docker compose logs...');
        try {
          const logs = await platformAPI.executeCommand('bash', ['-c', `cd ${installPath} && docker compose logs --tail=50`]);
          await this.log(`Docker compose logs: ${logs}`);
        } catch {
          await this.log('Could not fetch docker compose logs');
        }
      }
    } catch (err) {
      await this.log(`Could not verify containers: ${err}`);
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
        // Check all running containers, not just backend
        const psOutput = await platformAPI.executeCommand('docker', ['ps', '--format', '{{.Names}}']);
        
        await this.log(`Attempt ${attempts + 1}/${maxAttempts}: Running containers: ${psOutput.trim() || '(none)'}`);

        // Check if ANY plexarr container is running
        if (psOutput && psOutput.toLowerCase().includes('plexarr')) {
          await this.log(`PlexArr containers found and running!`);
          
          // Check specifically for backend and frontend
          const backendRunning = psOutput.toLowerCase().includes('backend');
          const frontendRunning = psOutput.toLowerCase().includes('frontend');
          
          await this.log(`Backend: ${backendRunning ? 'RUNNING' : 'NOT FOUND'}, Frontend: ${frontendRunning ? 'RUNNING' : 'NOT FOUND'}`);
          
          if (backendRunning || frontendRunning) {
            await this.log('Core services are running! Waiting 3 seconds for initialization...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.log('Services are healthy!');
            return;
          }
        }
        
        // If no containers found, check if they exist but are stopped
        if (attempts % 5 === 0) {
          const allContainers = await platformAPI.executeCommand('docker', ['ps', '-a', '--filter', 'name=plexarr', '--format', '{{.Names}} ({{.Status}})']);
          await this.log(`All PlexArr containers (running or stopped): ${allContainers.trim() || '(none)'}`);
        }
        
      } catch (err) {
        await this.log(`Attempt ${attempts + 1}/${maxAttempts}: docker ps check failed: ${err}`);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    await this.log(`ERROR: Services did not start within ${timeout}ms (${maxAttempts} attempts)`);
    
    // Final diagnostic check
    try {
      const finalCheck = await platformAPI.executeCommand('docker', ['ps', '-a', '--format', '{{.Names}} - {{.Status}}']);
      await this.log(`Final container status: ${finalCheck}`);
    } catch {
      await this.log('Could not perform final diagnostic check');
    }
    
    throw new Error('Services did not start within timeout period');
  }
}

export const installationService = new InstallationService();
