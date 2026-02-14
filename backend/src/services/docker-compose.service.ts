import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ConfigData } from '../models/config.model';

/**
 * Service to generate docker-compose.yml from user configuration
 */
export class DockerComposeService {
  private templatePath: string;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(__dirname, '../../templates/stack-template.yml');
  }

  /**
   * Generate docker-compose.yml from configuration
   */
  generateDockerCompose(config: ConfigData): string {
    // Load template
    const template = fs.readFileSync(this.templatePath, 'utf8');
    
    // Replace all placeholders
    let dockerCompose = template;

    // System placeholders
    dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_UID', config.system.puid.toString());
    dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_GID', config.system.pgid.toString());
    dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_TIMEZONE', config.system.timezone);

    // Nginx Proxy Manager
    if (config.services.nginxProxyManager.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_ADMIN_PORT', config.services.nginxProxyManager.adminPort.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_HTTP_PORT', config.services.nginxProxyManager.httpPort.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_HTTPS_PORT', config.services.nginxProxyManager.httpsPort.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NPM_DATA_PATH', config.services.nginxProxyManager.dataPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_LETSENCRYPT_PATH', config.services.nginxProxyManager.letsencryptPath);
    }

    // Radarr
    if (config.services.radarr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_RADARR_PORT', config.services.radarr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_RADARR_CONFIG', config.services.radarr.configPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_DOWNLOADS_ROOT', config.services.radarr.downloadsRoot);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MOVIES_DOWNLOAD_PATH', config.services.radarr.moviesDownloadPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NZB_PATH', config.services.radarr.nzbPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MOVIES_LIBRARY', config.services.radarr.moviesLibrary);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_COMPLETED_PATH', config.services.radarr.completedPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_CLASSICS_DOWNLOAD_PATH', config.services.radarr.classicsDownloadPath);
    }

    // Prowlarr
    if (config.services.prowlarr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_PROWLARR_PORT', config.services.prowlarr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MEDIA_ROOT', config.services.prowlarr.mediaRoot);
    }

    // Sonarr
    if (config.services.sonarr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_SONARR_PORT', config.services.sonarr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_TV_DOWNLOAD_PATH', config.services.sonarr.tvDownloadPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_TV_LIBRARY', config.services.sonarr.tvLibrary);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_COMPLETED_TV_PATH', config.services.sonarr.completedTvPath);
    }

    // Plex
    if (config.services.plex.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_DISNEY_DOWNLOAD_PATH', config.services.plex.disneyDownloadPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MUSIC_ROOT', config.services.plex.musicRoot);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_YOUTUBE_MUSIC_PATH', config.services.plex.youtubeMusicPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_WALKTHROUGHS_PATH', config.services.plex.walkthroughsPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NEW_MOVIES_PATH', config.services.plex.newMoviesPath);
      
      // Handle GPU runtime
      if (!config.services.plex.useGpu) {
        dockerCompose = dockerCompose.replace(/runtime: nvidia.*\n/g, '');
        dockerCompose = dockerCompose.replace(/- NVIDIA_VISIBLE_DEVICES=.*\n/g, '');
        dockerCompose = dockerCompose.replace(/- NVIDIA_DRIVER_CAPABILITIES=.*\n/g, '');
      }
    }

    // Overseerr
    if (config.services.overseerr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_OVERSEERR_PORT', config.services.overseerr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_OVERSEERR_CONFIG', config.services.overseerr.configPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_PLEX_MEDIA_ROOT', config.services.overseerr.plexMediaRoot);
    }

    // Lidarr
    if (config.services.lidarr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_LIDARR_PORT', config.services.lidarr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_LIDARR_CONFIG', config.services.lidarr.configPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MUSIC_LIBRARY', config.services.lidarr.musicLibrary);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MUSIC_DOWNLOADS', config.services.lidarr.musicDownloads);
    }

    // NZBGet
    if (config.services.nzbget.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NZBGET1_PORT', config.services.nzbget.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NZBGET_CONFIG', config.services.nzbget.configPath);
    }

    // NZBGet2
    if (config.services.nzbget2.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NZBGET2_PORT', config.services.nzbget2.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_NZBGET2_CONFIG', config.services.nzbget2.configPath);
    }

    // Lidify
    if (config.services.lidify.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_LIDIFY_PORT', config.services.lidify.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_LIDIFY_CONFIG', config.services.lidify.configPath);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_CLEAN_MUSIC_PATH', config.services.lidify.cleanMusicPath);
    }

    // WireGuard
    if (config.services.wgEasy.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_PUBLIC_IP_OR_DOMAIN', config.services.wgEasy.wgHost);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_BCRYPT_HASH_HERE', config.services.wgEasy.passwordHash);
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_WG_UI_PORT', config.services.wgEasy.uiPort.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_WG_CONFIG_PATH', config.services.wgEasy.configPath);
    }

    // Maintainerr
    if (config.services.maintainerr.enabled) {
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MAINTAINERR_PORT', config.services.maintainerr.port.toString());
      dockerCompose = this.replacePlaceholder(dockerCompose, 'YOUR_MAINTAINERR_CONFIG', config.services.maintainerr.configPath);
    }

    // Remove disabled services
    dockerCompose = this.removeDisabledServices(dockerCompose, config);

    return dockerCompose;
  }

  /**
   * Replace placeholder with value
   */
  private replacePlaceholder(content: string, placeholder: string, value: string): string {
    const regex = new RegExp(placeholder, 'g');
    return content.replace(regex, value);
  }

  /**
   * Remove services that are disabled
   */
  private removeDisabledServices(content: string, config: ConfigData): string {
    let result = content;

    // Parse YAML to manipulate services
    const doc: any = yaml.load(content);
    
    if (!config.services.nginxProxyManager.enabled) {
      delete doc.services.nomnomsites;
    }
    if (!config.services.radarr.enabled) {
      delete doc.services.radarr;
    }
    if (!config.services.sonarr.enabled) {
      delete doc.services.sonarr;
    }
    if (!config.services.prowlarr.enabled) {
      delete doc.services.prowlarr;
    }
    if (!config.services.lidarr.enabled) {
      delete doc.services.lidarr;
    }
    if (!config.services.plex.enabled) {
      delete doc.services.plex;
    }
    if (!config.services.overseerr.enabled) {
      delete doc.services.overseerr;
    }
    if (!config.services.wgEasy.enabled) {
      delete doc.services['wg-easy'];
    }
    if (!config.services.nzbget.enabled) {
      delete doc.services.nzbget;
    }
    if (!config.services.nzbget2.enabled) {
      delete doc.services.nzbget2;
    }
    if (!config.services.lidify.enabled) {
      delete doc.services.lidify;
    }
    if (!config.services.maintainerr.enabled) {
      delete doc.services.maintainerr;
    }

    result = yaml.dump(doc, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });

    return result;
  }

  /**
   * Save docker-compose.yml to file
   */
  saveDockerCompose(content: string, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
  }

  /**
   * Validate docker-compose file
   */
  validateDockerCompose(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const doc = yaml.load(content);
      
      if (!doc || typeof doc !== 'object') {
        errors.push('Invalid YAML structure');
        return { valid: false, errors };
      }

      // Check for remaining placeholders
      const placeholderRegex = /YOUR_[A-Z_]+/g;
      const matches = content.match(placeholderRegex);
      
      if (matches && matches.length > 0) {
        errors.push(`Unreplaced placeholders found: ${[...new Set(matches)].join(', ')}`);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`YAML parse error: ${error}`);
      return { valid: false, errors };
    }
  }
}
