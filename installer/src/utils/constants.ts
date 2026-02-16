import type { InstallerConfig, DockerDownloadUrls, WSL2DownloadUrl } from '../types/installer';

/**
 * Official Docker download URLs
 * Note: These URLs should be updated periodically to point to latest stable versions
 */
export const DOCKER_URLS: DockerDownloadUrls = {
  windows: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
  macIntel: 'https://desktop.docker.com/mac/main/amd64/Docker.dmg',
  macAppleSilicon: 'https://desktop.docker.com/mac/main/arm64/Docker.dmg',
  linuxScript: 'https://get.docker.com',
};

/**
 * WSL2 download URLs
 */
export const WSL2_URLS: WSL2DownloadUrl = {
  kernelUpdate: 'https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi',
};

/**
 * Minimum disk space requirements
 */
export const MIN_DISK_SPACE_GB = 50; // 50GB for PlexArr installation
export const MIN_DISK_SPACE_FOR_DOCKER_GB = 20; // Additional 20GB for Docker images

/**
 * Installation paths
 */
export const PATHS = {
  STATE_FILE: 'installation-state.json',
  LOG_FILE: 'installer.log',
  DOWNLOAD_DIR: 'downloads',
};

/**
 * Default installer configuration
 */
export const DEFAULT_CONFIG: InstallerConfig = {
  dockerUrls: DOCKER_URLS,
  wsl2Urls: WSL2_URLS,
  minDiskSpaceGB: MIN_DISK_SPACE_GB,
  minDiskSpaceForDockerGB: MIN_DISK_SPACE_FOR_DOCKER_GB,
  stateFilePath: PATHS.STATE_FILE,
  logFilePath: PATHS.LOG_FILE,
  downloadDirectory: PATHS.DOWNLOAD_DIR,
};

/**
 * Manual installation instructions templates
 */
export const MANUAL_INSTRUCTIONS = {
  WINDOWS_WSL2: {
    title: 'Install WSL2 Manually',
    description: 'Follow these steps to install WSL2 on Windows',
    officialUrl: 'https://docs.microsoft.com/en-us/windows/wsl/install',
    steps: [
      'Open PowerShell as Administrator',
      'Run: wsl --install',
      'Restart your computer when prompted',
      'After restart, open PowerShell and run: wsl --set-default-version 2',
      'Verify installation by running: wsl --status',
    ],
    copyableCommands: [
      'wsl --install',
      'wsl --set-default-version 2',
      'wsl --status',
    ],
  },
  
  WINDOWS_DOCKER: {
    title: 'Install Docker Desktop for Windows',
    description: 'Download and install Docker Desktop manually',
    officialUrl: 'https://docs.docker.com/desktop/install/windows-install/',
    steps: [
      'Download Docker Desktop from the official website',
      'Double-click Docker Desktop Installer.exe to run the installer',
      'Follow the installation wizard',
      'Enable WSL 2 integration when prompted',
      'Restart your computer if required',
      'Launch Docker Desktop from the Start menu',
      'Wait for Docker to start (whale icon in system tray)',
      'Verify installation by opening PowerShell and running: docker --version',
    ],
    copyableCommands: ['docker --version'],
  },

  MACOS_DOCKER: {
    title: 'Install Docker Desktop for macOS',
    description: 'Download and install Docker Desktop manually',
    officialUrl: 'https://docs.docker.com/desktop/install/mac-install/',
    steps: [
      'Download Docker Desktop for Mac from the official website',
      'Choose the correct version for your Mac (Intel or Apple Silicon)',
      'Double-click Docker.dmg to open the installer',
      'Drag the Docker icon to the Applications folder',
      'Launch Docker from Applications',
      'Follow the installation wizard and grant necessary permissions',
      'Wait for Docker to start (whale icon in menu bar)',
      'Verify installation by opening Terminal and running: docker --version',
    ],
    copyableCommands: ['docker --version'],
  },

  LINUX_DOCKER_UBUNTU: {
    title: 'Install Docker on Ubuntu/Debian',
    description: 'Install Docker Engine using the official repository',
    officialUrl: 'https://docs.docker.com/engine/install/ubuntu/',
    steps: [
      'Update package index: sudo apt-get update',
      'Install prerequisites: sudo apt-get install ca-certificates curl gnupg',
      'Add Docker GPG key: sudo install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg',
      'Set up repository: echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list',
      'Install Docker: sudo apt-get update && sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'Verify installation: sudo docker run hello-world',
      'Add user to docker group: sudo usermod -aG docker $USER',
      'Log out and log back in for group changes to take effect',
    ],
    copyableCommands: [
      'sudo apt-get update',
      'sudo apt-get install ca-certificates curl gnupg',
      'curl -fsSL https://get.docker.com -o get-docker.sh',
      'sudo sh get-docker.sh',
      'sudo usermod -aG docker $USER',
    ],
  },

  LINUX_DOCKER_FEDORA: {
    title: 'Install Docker on Fedora',
    description: 'Install Docker Engine using the official repository',
    officialUrl: 'https://docs.docker.com/engine/install/fedora/',
    steps: [
      'Remove old versions: sudo dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine',
      'Install dnf-plugins: sudo dnf -y install dnf-plugins-core',
      'Add Docker repository: sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo',
      'Install Docker: sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'Start Docker: sudo systemctl start docker',
      'Enable Docker to start on boot: sudo systemctl enable docker',
      'Add user to docker group: sudo usermod -aG docker $USER',
      'Log out and log back in for group changes to take effect',
    ],
    copyableCommands: [
      'sudo dnf -y install dnf-plugins-core',
      'sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo',
      'sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'sudo systemctl start docker && sudo systemctl enable docker',
      'sudo usermod -aG docker $USER',
    ],
  },

  LINUX_DOCKER_ARCH: {
    title: 'Install Docker on Arch Linux',
    description: 'Install Docker Engine using pacman',
    officialUrl: 'https://wiki.archlinux.org/title/Docker',
    steps: [
      'Install Docker: sudo pacman -S docker',
      'Start Docker service: sudo systemctl start docker.service',
      'Enable Docker to start on boot: sudo systemctl enable docker.service',
      'Add user to docker group: sudo usermod -aG docker $USER',
      'Log out and log back in for group changes to take effect',
      'Verify installation: docker --version',
    ],
    copyableCommands: [
      'sudo pacman -S docker',
      'sudo systemctl start docker.service && sudo systemctl enable docker.service',
      'sudo usermod -aG docker $USER',
    ],
  },
};

/**
 * Error codes
 */
export const ERROR_CODES = {
  INSUFFICIENT_DISK_SPACE: 'ERR_DISK_SPACE',
  INCOMPATIBLE_OS: 'ERR_OS_INCOMPATIBLE',
  DOWNLOAD_FAILED: 'ERR_DOWNLOAD_FAILED',
  INSTALLATION_FAILED: 'ERR_INSTALL_FAILED',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',
  WSL2_NOT_INSTALLED: 'ERR_WSL2_MISSING',
  DOCKER_NOT_INSTALLED: 'ERR_DOCKER_MISSING',
  REBOOT_REQUIRED: 'ERR_REBOOT_REQUIRED',
  RELOGIN_REQUIRED: 'ERR_RELOGIN_REQUIRED',
  NETWORK_ERROR: 'ERR_NETWORK',
  UNKNOWN_ERROR: 'ERR_UNKNOWN',
};

/**
 * Installation step IDs
 */
export const STEP_IDS = {
  CHECK_SYSTEM: 'check_system',
  CHECK_DISK_SPACE: 'check_disk_space',
  INSTALL_WSL2: 'install_wsl2',
  REBOOT_WSL2: 'reboot_wsl2',
  INSTALL_DOCKER: 'install_docker',
  CONFIGURE_DOCKER: 'configure_docker',
  ADD_DOCKER_GROUP: 'add_docker_group',
  RELOGIN: 'relogin',
  VERIFY_DOCKER: 'verify_docker',
  INSTALL_PLEXARR: 'install_plexarr',
  COMPLETE: 'complete',
};
