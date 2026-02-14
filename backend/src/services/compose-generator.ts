// Docker Compose generator using unified config schema

import * as yaml from 'js-yaml';
import { PlexArrConfig } from '../models/config';

export function generateCompose(config: PlexArrConfig): string {
  const services: Record<string, any> = {};

  const env = {
    PUID: config.system.puid.toString(),
    PGID: config.system.pgid.toString(),
    TZ: config.system.timezone,
  };

  const moviesPath = config.storage.movies || `${config.storage.mediaRoot}/movies`;
  const tvPath = config.storage.tv || `${config.storage.mediaRoot}/tv`;
  const musicPath = config.storage.music || `${config.storage.mediaRoot}/music`;

  if (config.services.plex.enabled) {
    services.plex = {
      image: 'lscr.io/linuxserver/plex:latest',
      container_name: 'plex',
      network_mode: 'host',
      environment: { ...env, VERSION: 'docker' },
      volumes: [
        `${config.storage.config}/plex:/config`,
        `${moviesPath}:/movies`,
        `${tvPath}:/tv`,
        `${musicPath}:/music`,
      ],
      restart: 'unless-stopped',
    };
  }

  if (config.services.radarr.enabled) {
    services.radarr = {
      image: 'lscr.io/linuxserver/radarr:latest',
      container_name: 'radarr',
      environment: env,
      ports: [`${config.services.radarr.port}:7878`],
      volumes: [
        `${config.storage.config}/radarr:/config`,
        `${moviesPath}:/movies`,
        `${config.storage.downloads}:/downloads`,
      ],
      restart: 'unless-stopped',
    };
  }

  if (config.services.sonarr.enabled) {
    services.sonarr = {
      image: 'lscr.io/linuxserver/sonarr:latest',
      container_name: 'sonarr',
      environment: env,
      ports: [`${config.services.sonarr.port}:8989`],
      volumes: [
        `${config.storage.config}/sonarr:/config`,
        `${tvPath}:/tv`,
        `${config.storage.downloads}:/downloads`,
      ],
      restart: 'unless-stopped',
    };
  }

  if (config.services.lidarr.enabled) {
    services.lidarr = {
      image: 'lscr.io/linuxserver/lidarr:latest',
      container_name: 'lidarr',
      environment: env,
      ports: [`${config.services.lidarr.port}:8686`],
      volumes: [
        `${config.storage.config}/lidarr:/config`,
        `${musicPath}:/music`,
        `${config.storage.downloads}:/downloads`,
      ],
      restart: 'unless-stopped',
    };
  }

  if (config.services.prowlarr.enabled) {
    services.prowlarr = {
      image: 'lscr.io/linuxserver/prowlarr:latest',
      container_name: 'prowlarr',
      environment: env,
      ports: [`${config.services.prowlarr.port}:9696`],
      volumes: [`${config.storage.config}/prowlarr:/config`],
      restart: 'unless-stopped',
    };
  }

  if (config.services.overseerr.enabled) {
    services.overseerr = {
      image: 'sctx/overseerr:latest',
      container_name: 'overseerr',
      environment: env,
      ports: [`${config.services.overseerr.port}:5055`],
      volumes: [`${config.storage.config}/overseerr:/app/config`],
      restart: 'unless-stopped',
    };
  }

  if (config.services.maintainerr.enabled) {
    services.maintainerr = {
      image: 'ghcr.io/jorenn92/maintainerr:latest',
      container_name: 'maintainerr',
      environment: env,
      ports: [`${config.services.maintainerr.port}:6246`],
      volumes: [`${config.storage.config}/maintainerr:/opt/data`],
      restart: 'unless-stopped',
    };
  }

  if (config.services.nzbget.enabled) {
    services.nzbget = {
      image: 'lscr.io/linuxserver/nzbget:latest',
      container_name: 'nzbget',
      environment: env,
      ports: [`${config.services.nzbget.port}:6789`],
      volumes: [
        `${config.storage.config}/nzbget:/config`,
        `${config.storage.downloads}:/downloads`,
      ],
      restart: 'unless-stopped',
    };
  }

  // Attach all non-host-network services to plexarr_default
  for (const [name, svc] of Object.entries(services)) {
    if (!svc.network_mode) {
      svc.networks = ['plexarr_default'];
    }
  }

  const compose = {
    version: '3.8',
    services,
    networks: {
      plexarr_default: { external: true },
    },
  };

  return yaml.dump(compose, { lineWidth: 120, noRefs: true });
}
