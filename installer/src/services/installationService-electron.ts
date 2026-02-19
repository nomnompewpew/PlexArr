import type { SystemInfo } from '../types/installer';

interface InstallationProgress {
  status: 'downloading' | 'extracting' | 'installing' | 'starting_services' | 'waiting_for_services';
  progress: number; // 0-100
  message: string;
}

/**
 * Service for managing the actual PlexArr installation (Electron version)
 */
export class InstallationService {
  private progressCallback?: (progress: InstallationProgress) => void;
  private passwordCallback?: () => Promise<string>;
  private cachedPassword?: string;
  private logFile = `/tmp/plexarr-install-debug-${Date.now()}.log`;

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
    
    try {
      await window.electronAPI.executeCommand('bash', [
        '-c',
        `echo "${logMessage.replace(/"/g, '\\"')}" >> ${this.logFile}`
      ]);
    } catch {
      console.error(`Failed to log to ${this.logFile}`);
    }
  }

  private updateProgress(status: InstallationProgress['status'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ status, progress, message });
    }
    this.log(`PROGRESS: ${progress}% - ${status} - ${message}`).catch(() => {});
  }

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
      
      this.updateProgress('downloading', 10, 'Preparing installation...');
      const installPath = await this.getInstallationPath(systemInfo);
      await this.log(`Installation path: ${installPath}`);
      
      if (systemInfo.platform !== 'windows') {
        this.updateProgress('downloading', 15, 'Authenticating for installation...');
        await this.log('Starting sudo pre-authentication...');
        await this.authenticateSudo();
        await this.log('Sudo pre-authentication successful');
      }
      
      this.updateProgress('downloading', 20, 'Cloning PlexArr from GitHub...');
      await this.log('Starting GitHub clone...');
      const sourcePath = await this.getOrClonePlexArr(systemInfo);
      await this.log(`Successfully cloned to: ${sourcePath}`);
      
      this.updateProgress('downloading', 40, 'Copying files to installation directory...');
      await this.log(`Starting file copy from ${sourcePath} to ${installPath}...`);
      await this.copyPlexArrFiles(sourcePath, installPath, systemInfo);
      await this.log('File copy complete');
      
      this.updateProgress('installing', 50, 'Configuring permissions...');
      await this.log('Starting permissions fix...');
      await this.fixPermissions(installPath, systemInfo);
      await this.log('Permissions fix complete');
      
      this.updateProgress('starting_services', 65, 'Building Docker images and starting services...');
      await this.log('Starting docker compose up...');
      await this.startPlexArrServices(installPath, systemInfo);
      await this.log('Docker compose command executed');
      
      this.updateProgress('waiting_for_services', 85, 'Waiting for services to become healthy...');
      await this.log('Waiting for services to start (10 minute timeout)...');
      await this.waitForServices(10 * 60 * 1000);
      await this.log('Services are healthy!');
      
      this.updateProgress('waiting_for_services', 100, 'Installation complete!');
      await this.log(`=== Installation Complete ===`);
      await this.log(`Log file: ${this.logFile}`);
    } catch (error) {
      await this.log(`ERROR: ${error}`);
      throw new Error(`Installation failed: ${error}`);
    }
  }

  private async authenticateSudo(): Promise<void> {
    try {
      await this.log('Attempting non-interactive sudo (sudo -n true)...');
      await window.electronAPI.executeCommand('sudo', ['-n', 'true']);
      await this.log('Sudo already cached, no password needed');
      return;
    } catch {
      await this.log('Sudo not cached, requesting password from user...');
      const password = await this.getPassword();
      await this.log('Password received, attempting pre-authentication (sudo -S -v)...');
      
      const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      
      try {
        await window.electronAPI.executeCommand('bash', [
          '-c',
          `echo "${escapedPassword}" | sudo -S -v`
        ]);
        await this.log('Sudo pre-authentication successful!');
      } catch (err) {
        await this.log(`Sudo pre-authentication failed: ${err}`);
        throw new Error(`Failed to authenticate with sudo: ${err}`);
      }
    }
  }

  private async getInstallationPath(systemInfo: SystemInfo): Promise<string> {
    if (systemInfo.platform === 'windows') {
      return 'C:\\PlexArr';
    } else if (systemInfo.platform === 'darwin') {
      return '/Applications/PlexArr';
    } else {
      return '/opt/plexarr';
    }
  }

  private async getOrClonePlexArr(_systemInfo: SystemInfo): Promise<string> {
    const clonePath = '/tmp/plexarr-clone';
    
    try {
      await this.log(`Removing old clone directory: ${clonePath}...`);
      await window.electronAPI.executeCommand('rm', ['-rf', clonePath]);
      await this.log('Old clone directory removed');
    } catch {
      await this.log('No old clone directory to remove');
    }

    try {
      await this.log('Cloning PlexArr from GitHub (nomnompewpew/PlexArr)...');
      const result = await window.electronAPI.executeCommand('git', [
        'clone',
        '--depth',
        '1',
        'https://github.com/nomnompewpew/PlexArr.git',
        clonePath
      ]);
      await this.log(`Git clone completed: ${result}`);
      return clonePath;
    } catch (error) {
      await this.log(`Git clone failed: ${error}`);
      throw new Error(`Failed to clone PlexArr from GitHub: ${error}`);
    }
  }

  private async copyPlexArrFiles(
    sourcePath: string,
    installPath: string,
    systemInfo: SystemInfo
  ): Promise<void> {
    if (systemInfo.platform === 'windows') {
      try {
        await window.electronAPI.executeCommand('cmd', [
          '/c',
          `mkdir "${installPath}" 2>nul`
        ]);
      } catch {
        // Directory may exist
      }

      await window.electronAPI.executeCommand('cmd', [
        '/c',
        `xcopy "${sourcePath}" "${installPath}" /E /I /Y`
      ]);
      return;
    }

    const username = await window.electronAPI.executeCommand('whoami', []);
    const user = username.trim();

    try {
      await this.log('Checking for existing PlexArr containers...');
      const psOutput = await window.electronAPI.executeCommand('docker', [
        'ps',
        '--filter',
        'name=plexarr',
        '--format',
        '{{.Names}}'
      ]);
      
      if (psOutput && psOutput.trim()) {
        const containers = psOutput.trim().split('\n').filter(Boolean);
        await this.log(`Found ${containers.length} running containers: ${containers.join(', ')}`);
        
        for (const container of containers) {
          await this.log(`Stopping container: ${container}...`);
          try {
            await window.electronAPI.executeCommand('docker', ['stop', container]);
            await this.log(`Stopped ${container}`);
          } catch (err) {
            await this.log(`Warning: could not stop ${container}: ${err}`);
          }
        }
      } else {
        await this.log('No existing PlexArr containers found');
      }
    } catch (err) {
      await this.log(`Warning: could not check for existing containers: ${err}`);
    }

    try {
      await this.log(`Creating directory ${installPath} with sudo...`);
      const password = await this.getPassword();
      const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      
      await window.electronAPI.executeCommand('bash', [
        '-c',
        `echo "${escapedPassword}" | sudo -S mkdir -p ${installPath}`
      ]);
      await this.log('Directory created');
    } catch (err) {
      await this.log(`Warning: mkdir failed (may already exist): ${err}`);
    }

    await this.log(`Copying files from ${sourcePath} to ${installPath}...`);
    const password = await this.getPassword();
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    await window.electronAPI.executeCommand('bash', [
      '-c',
      `echo "${escapedPassword}" | sudo -S cp -r ${sourcePath}/* ${installPath}/`
    ]);
    await this.log('Files copied successfully');

    await this.log(`Setting ownership to ${user}...`);
    await window.electronAPI.executeCommand('bash', [
      '-c',
      `echo "${escapedPassword}" | sudo -S chown -R ${user}:${user} ${installPath}`
    ]);
    await this.log('Ownership set');
  }

  private async fixPermissions(installPath: string, systemInfo: SystemInfo): Promise<void> {
    if (systemInfo.platform === 'windows') {
      return;
    }

    const username = await window.electronAPI.executeCommand('whoami', []);
    const user = username.trim();
    
    await this.log(`Ensuring ${user} is in the docker group...`);
    const password = await this.getPassword();
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');

    try {
      await window.electronAPI.executeCommand('bash', [
        '-c',
        `echo "${escapedPassword}" | sudo -S usermod -aG docker ${user}`
      ]);
      await this.log('User added to docker group');
    } catch (err) {
      await this.log(`Warning: could not add user to docker group: ${err}`);
    }

    try {
      await this.log('Activating docker group membership...');
      await window.electronAPI.executeCommand('newgrp', ['docker']);
      await this.log('Docker group activated');
    } catch (err) {
      await this.log(`Note: newgrp failed (expected): ${err}`);
    }

    await this.log('Setting executable permissions...');
    await window.electronAPI.executeCommand('bash', [
      '-c',
      `chmod +x ${installPath}/*.sh || true`
    ]);
    await this.log('Permissions set');
  }

  private async startPlexArrServices(installPath: string, systemInfo: SystemInfo): Promise<void> {
    if (systemInfo.platform === 'windows') {
      const composeFile = `${installPath}\\docker-compose.yml`;
      await window.electronAPI.executeCommand('cmd', [
        '/c',
        `cd /d ${installPath} && docker compose -f ${composeFile} up --build -d`
      ]);
      return;
    }

    const composeFile = `${installPath}/docker-compose.yml`;
    
    try {
      await this.log('Attempting docker compose without sudo...');
      const result = await window.electronAPI.executeCommand('nohup', [
        'docker',
        'compose',
        '-f',
        composeFile,
        'up',
        '--build',
        '-d'
      ]);
      await this.log(`Docker compose started (no sudo needed): ${result}`);
    } catch {
      try {
        await this.log('Docker compose without sudo failed, trying with sudo...');
        const password = await this.getPassword();
        const escapedPassword = password.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        const result = await window.electronAPI.executeCommand('bash', [
          '-c',
          `echo "${escapedPassword}" | sudo -S nohup docker compose -f ${composeFile} up --build -d > /dev/null 2>&1 &`
        ]);
        await this.log(`Docker compose started (with sudo): ${result}`);
      } catch (err) {
        await this.log(`Failed to start Docker services: ${err}`);
        throw new Error(`Failed to start Docker services: ${err}`);
      }
    }
  }

  private async waitForServices(timeout: number): Promise<void> {
    const checkInterval = 5000;
    const maxAttempts = Math.ceil(timeout / checkInterval);
    let attempts = 0;

    await this.log(`Starting service health check (timeout: ${timeout}ms, ${maxAttempts} attempts every ${checkInterval}ms)...`);

    while (attempts < maxAttempts) {
      try {
        const psOutput = await window.electronAPI.executeCommand('docker', [
          'ps',
          '--filter',
          'name=plexarr-backend',
          '--format',
          '{{.Names}}'
        ]);

        if (psOutput && psOutput.toLowerCase().includes('plexarr-backend')) {
          await this.log(`Container plexarr-backend found! Output: "${psOutput.trim()}"`);
          await this.log('Waiting 2 seconds for frontend container to start...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.log('Services are healthy!');
          return;
        } else {
          await this.log(`Attempt ${attempts + 1}/${maxAttempts}: plexarr-backend not running yet. Output: "${psOutput?.trim() || '(empty)'}"`);
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
    throw new Error('Services did not start within timeout period');
  }
}

export const installationService = new InstallationService();
