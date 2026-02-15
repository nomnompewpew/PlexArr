// Default configuration factory for PlexArr

import { PlexArrConfig } from './config';

export function createDefaultConfig(): PlexArrConfig {
  return {
    version: 1,
    system: { timezone: 'America/New_York', puid: 1000, pgid: 1000, projectFolder: '/opt/plexarr' },
    network: {},
    storage: {
      mediaRoot: '/data/media',
      downloads: '/data/downloads',
      config: '/opt/plexarr/config',
    },
    services: {
      plex:        { enabled: true,  port: 32400 },
      radarr:      { enabled: true,  port: 7878  },
      sonarr:      { enabled: true,  port: 8989  },
      lidarr:      { enabled: false, port: 8686  },
      prowlarr:    { enabled: true,  port: 9696  },
      overseerr:   { enabled: true,  port: 5055  },
      maintainerr: { enabled: true,  port: 6246  },
      nzbget:      { enabled: true,  port: 6789  },
      nzbgetMusic: { enabled: false, port: 6790  },
      qbittorrent: { enabled: false, port: 8080  },
      metube:      { enabled: false, port: 8081  },
    },
  };
}
