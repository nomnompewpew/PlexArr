import { invoke } from '@tauri-apps/api/tauri';
import type { PrerequisiteCheck, SystemInfo, DiskSpace } from '../types/installer';

/**
 * Service for checking installation prerequisites
 */
export class PrerequisiteService {
  /**
   * Check all prerequisites for the given platform
   */
  async checkAll(systemInfo: SystemInfo): Promise<PrerequisiteCheck[]> {
    const checks: PrerequisiteCheck[] = [];

    // Disk space check (universal)
    checks.push(await this.checkDiskSpace());

    // Platform-specific checks
    if (systemInfo.platform === 'windows') {
      checks.push(...await this.checkWindowsPrerequisites());
    } else if (systemInfo.platform === 'darwin') {
      checks.push(...await this.checkMacOSPrerequisites());
    } else if (systemInfo.platform === 'linux') {
      checks.push(...await this.checkLinuxPrerequisites(systemInfo));
    }

    return checks;
  }

  /**
   * Check available disk space
   */
  private async checkDiskSpace(): Promise<PrerequisiteCheck> {
    try {
      // Get home directory directly from Rust backend
      const diskSpace = await invoke<DiskSpace>('check_disk_space', {
        path: ''  // Empty path will use home directory in Rust backend
      });

      const requiredGB = 50; // 50GB minimum
      const availableGB = diskSpace.available / (1024 ** 3);
      const totalGB = diskSpace.total / (1024 ** 3);

      const passed = availableGB >= requiredGB;

      return {
        name: 'Disk Space',
        status: passed ? 'passed' : 'failed',
        message: passed
          ? `${availableGB.toFixed(2)} GB available (${totalGB.toFixed(2)} GB total)`
          : `Insufficient disk space: ${availableGB.toFixed(2)} GB available, ${requiredGB} GB required`,
        required: true,
        canAutoFix: false,
      };
    } catch (error) {
      return {
        name: 'Disk Space',
        status: 'failed',
        message: `Failed to check disk space: ${error}`,
        required: true,
        canAutoFix: false,
      };
    }
  }

  /**
   * Check Windows-specific prerequisites
   */
  private async checkWindowsPrerequisites(): Promise<PrerequisiteCheck[]> {
    const checks: PrerequisiteCheck[] = [];

    // Check Windows version
    checks.push(await this.checkWindowsVersion());

    // Check WSL2
    checks.push(await this.checkWSL2());

    // Check Docker Desktop
    checks.push(await this.checkDockerWindows());

    // Check Hyper-V
    checks.push(await this.checkHyperV());

    return checks;
  }

  /**
   * Check Windows version
   */
  private async checkWindowsVersion(): Promise<PrerequisiteCheck> {
    try {
      const version = await invoke<string>('execute_command', {
        command: 'cmd',
        args: ['/c', 'ver']
      });

      // Windows 10 version 2004 or later is required for WSL2
      const isCompatible = version.includes('10.0.') || version.includes('11.');

      return {
        name: 'Windows Version',
        status: isCompatible ? 'passed' : 'failed',
        message: isCompatible
          ? `Windows 10/11 detected: ${version.trim()}`
          : `Windows 10 version 2004 or later is required. Current: ${version.trim()}`,
        required: true,
        canAutoFix: false,
      };
    } catch (error) {
      return {
        name: 'Windows Version',
        status: 'failed',
        message: `Failed to detect Windows version: ${error}`,
        required: true,
        canAutoFix: false,
      };
    }
  }

  /**
   * Check if WSL2 is installed
   */
  private async checkWSL2(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'wsl',
        args: ['--status']
      });

      const hasWSL2 = result.includes('WSL 2') || result.includes('Default Version: 2');

      return {
        name: 'WSL2',
        status: hasWSL2 ? 'passed' : 'failed',
        message: hasWSL2
          ? 'WSL2 is installed and configured'
          : 'WSL2 is not installed or not set as default',
        required: true,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'WSL2',
        status: 'failed',
        message: 'WSL2 is not installed',
        required: true,
        canAutoFix: true,
      };
    }
  }

  /**
   * Check if Docker is installed on Windows
   */
  private async checkDockerWindows(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'docker',
        args: ['--version']
      });

      const hasDocker = result.toLowerCase().includes('docker');

      return {
        name: 'Docker Desktop',
        status: hasDocker ? 'passed' : 'failed',
        message: hasDocker
          ? `Docker is installed: ${result.trim()}`
          : 'Docker Desktop is not installed',
        required: true,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'Docker Desktop',
        status: 'failed',
        message: 'Docker Desktop is not installed',
        required: true,
        canAutoFix: true,
      };
    }
  }

  /**
   * Check if Hyper-V is enabled
   */
  private async checkHyperV(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'powershell',
        args: ['-Command', 'Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All | Select-Object -ExpandProperty State']
      });

      const isEnabled = result.trim().toLowerCase() === 'enabled';

      return {
        name: 'Hyper-V',
        status: isEnabled ? 'passed' : 'pending',
        message: isEnabled
          ? 'Hyper-V is enabled'
          : 'Hyper-V may need to be enabled (Docker Desktop will handle this)',
        required: false,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'Hyper-V',
        status: 'pending',
        message: 'Unable to check Hyper-V status (will be configured by Docker Desktop)',
        required: false,
        canAutoFix: true,
      };
    }
  }

  /**
   * Check macOS-specific prerequisites
   */
  private async checkMacOSPrerequisites(): Promise<PrerequisiteCheck[]> {
    const checks: PrerequisiteCheck[] = [];

    // Check macOS version
    checks.push(await this.checkMacOSVersion());

    // Check Docker Desktop
    checks.push(await this.checkDockerMacOS());

    return checks;
  }

  /**
   * Check macOS version
   */
  private async checkMacOSVersion(): Promise<PrerequisiteCheck> {
    try {
      const version = await invoke<string>('execute_command', {
        command: 'sw_vers',
        args: ['-productVersion']
      });

      const versionNumber = parseFloat(version.trim().split('.').slice(0, 2).join('.'));
      const isCompatible = versionNumber >= 10.15; // Catalina or later

      return {
        name: 'macOS Version',
        status: isCompatible ? 'passed' : 'failed',
        message: isCompatible
          ? `macOS ${version.trim()} (compatible)`
          : `macOS ${version.trim()} (requires macOS 10.15 Catalina or later)`,
        required: true,
        canAutoFix: false,
      };
    } catch (error) {
      return {
        name: 'macOS Version',
        status: 'failed',
        message: `Failed to detect macOS version: ${error}`,
        required: true,
        canAutoFix: false,
      };
    }
  }

  /**
   * Check if Docker is installed on macOS
   */
  private async checkDockerMacOS(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'docker',
        args: ['--version']
      });

      const hasDocker = result.toLowerCase().includes('docker');

      return {
        name: 'Docker Desktop',
        status: hasDocker ? 'passed' : 'failed',
        message: hasDocker
          ? `Docker is installed: ${result.trim()}`
          : 'Docker Desktop is not installed',
        required: true,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'Docker Desktop',
        status: 'failed',
        message: 'Docker Desktop is not installed',
        required: true,
        canAutoFix: true,
      };
    }
  }

  /**
   * Check Linux-specific prerequisites
   */
  private async checkLinuxPrerequisites(_systemInfo: SystemInfo): Promise<PrerequisiteCheck[]> {
    const checks: PrerequisiteCheck[] = [];

    // Check Docker
    checks.push(await this.checkDockerLinux());

    // Check Docker Compose
    checks.push(await this.checkDockerCompose());

    // Check user in docker group
    checks.push(await this.checkDockerGroup());

    return checks;
  }

  /**
   * Check if Docker is installed on Linux
   */
  private async checkDockerLinux(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'docker',
        args: ['--version']
      });

      const hasDocker = result.toLowerCase().includes('docker');

      return {
        name: 'Docker',
        status: hasDocker ? 'passed' : 'failed',
        message: hasDocker
          ? `Docker is installed: ${result.trim()}`
          : 'Docker is not installed',
        required: true,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'Docker',
        status: 'failed',
        message: 'Docker is not installed',
        required: true,
        canAutoFix: true,
      };
    }
  }

  /**
   * Check if Docker Compose is installed
   */
  private async checkDockerCompose(): Promise<PrerequisiteCheck> {
    try {
      // Try docker compose plugin first
      const pluginResult = await invoke<string>('execute_command', {
        command: 'docker',
        args: ['compose', 'version']
      });

      if (pluginResult.toLowerCase().includes('docker compose')) {
        return {
          name: 'Docker Compose',
          status: 'passed',
          message: `Docker Compose plugin: ${pluginResult.trim()}`,
          required: true,
          canAutoFix: true,
        };
      }
    } catch {
      // Plugin not available, try standalone
      try {
        const standaloneResult = await invoke<string>('execute_command', {
          command: 'docker-compose',
          args: ['--version']
        });

        if (standaloneResult.toLowerCase().includes('docker-compose')) {
          return {
            name: 'Docker Compose',
            status: 'passed',
            message: `Docker Compose standalone: ${standaloneResult.trim()}`,
            required: true,
            canAutoFix: true,
          };
        }
      } catch {
        // Neither available
      }
    }

    return {
      name: 'Docker Compose',
      status: 'failed',
      message: 'Docker Compose is not installed',
      required: true,
      canAutoFix: true,
    };
  }

  /**
   * Check if user is in docker group
   */
  private async checkDockerGroup(): Promise<PrerequisiteCheck> {
    try {
      const result = await invoke<string>('execute_command', {
        command: 'groups',
        args: []
      });

      const inDockerGroup = result.toLowerCase().includes('docker');

      return {
        name: 'Docker Group',
        status: inDockerGroup ? 'passed' : 'failed',
        message: inDockerGroup
          ? 'User is in docker group'
          : 'User is not in docker group (sudo required for docker commands)',
        required: false,
        canAutoFix: true,
      };
    } catch (error) {
      return {
        name: 'Docker Group',
        status: 'failed',
        message: 'Failed to check docker group membership',
        required: false,
        canAutoFix: true,
      };
    }
  }
}

// Export singleton instance
export const prerequisiteService = new PrerequisiteService();
