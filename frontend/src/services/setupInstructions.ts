// Setup instructions and requirements for each service

import { PlexArrConfig } from '../types/plexarr-config.types';

export interface SetupInstruction {
  service: string;
  title: string;
  minimumSteps: string[];
  externalLinks: { label: string; url: string }[];
  contextValues: Record<string, string>;
  specialNotes?: string;
}

export const generateSetupInstructions = (
  service: string,
  config: PlexArrConfig,
  previouslyCompletedServices: string[]
): SetupInstruction => {
  const mediaRoot = config.storage.mediaRoot;
  const downloadsRoot = config.storage.downloads;
  const configRoot = config.storage.config;
  const timezone = config.system.timezone;

  const baseContext = {
    mediaRoot,
    downloadsRoot,
    configRoot,
    timezone,
    plexPort: String(config.services.plex?.port || 32400),
    radarrPort: String(config.services.radarr?.port || 7878),
    sonarrPort: String(config.services.sonarr?.port || 8989),
    downloadsPath: `${downloadsRoot}/nzb` // Common default
  };

  const instructions: Record<string, SetupInstruction> = {
    plex: {
      service: 'plex',
      title: 'Plex Media Server Setup',
      minimumSteps: [
        '1. Sign in or create a Plex account (if prompted)',
        '2. Name your Plex server (e.g., "MyPlex" or your machine name)',
        '3. Create a library for Movies - point to: ' + (baseContext.mediaRoot + '/movies' || '/data/media/movies'),
        '4. Create a library for TV Shows - point to: ' + (baseContext.mediaRoot + '/tv' || '/data/media/tv'),
        '5. Optional: Create a library for Music - point to: ' + (baseContext.mediaRoot + '/music' || '/data/media/music'),
        '6. Allow time for Plex to scan and identify media (may show "Scanning library...")',
        '7. Note your Plex PIN or enable "Authorized Devices" for other apps'
      ],
      externalLinks: [
        { label: 'Create/Login to Plex Account', url: 'https://www.plex.tv/sign-in/' },
        { label: 'Plex Documentation', url: 'https://support.plex.tv/articles/' }
      ],
      contextValues: {
        'Movies Path': baseContext.mediaRoot + '/movies',
        'TV Path': baseContext.mediaRoot + '/tv',
        'Music Path': baseContext.mediaRoot + '/music'
      },
      specialNotes: 'Plex is your media library foundation. All other services depend on having this set up first.'
    },

    radarr: {
      service: 'radarr',
      title: 'Radarr (Movie Management) Setup',
      minimumSteps: [
        '1. Go to Settings → Media Management',
        '2. Set Root Folder to: ' + (baseContext.mediaRoot + '/movies' || '/data/media/movies'),
        '3. Go to Settings → Download Clients',
        '4. Add your download client (NZBGet or qBittorrent) - you\'ll configure this after',
        '5. Go to Settings → Indexers (if Prowlarr isn\'t connected yet)',
        '6. Go to Movies → Add New Movie',
        '7. Search for a movie and add it - mark as "cutoff unmet" to test downloading'
      ],
      externalLinks: [
        { label: 'Radarr Setup Guide', url: 'https://wiki.servarr.com/en/radarr/quick-start-guide' },
        { label: 'Radarr Settings Help', url: 'https://wiki.servarr.com/en/radarr/settings' }
      ],
      contextValues: {
        'Root Folder': baseContext.mediaRoot + '/movies',
        'Downloads Folder': baseContext.downloadsPath,
        'Timezone': baseContext.timezone
      },
      specialNotes: previouslyCompletedServices.includes('plex')
        ? 'Radarr manages movie downloads to: ' + baseContext.mediaRoot + '/movies'
        : 'Set up Plex first so Radarr knows where your movies live.'
    },

    sonarr: {
      service: 'sonarr',
      title: 'Sonarr (TV Show Management) Setup',
      minimumSteps: [
        '1. Go to Settings → Media Management',
        '2. Set Root Folder to: ' + (baseContext.mediaRoot + '/tv' || '/data/media/tv'),
        '3. Go to Settings → Download Clients',
        '4. Add your download client (NZBGet or qBittorrent)',
        '5. Go to Settings → Indexers (if Prowlarr isn\'t connected yet)',
        '6. Go to Series → Add New Series',
        '7. Search for a show and add it - mark as "cutoff unmet" to test downloading'
      ],
      externalLinks: [
        { label: 'Sonarr Setup Guide', url: 'https://wiki.servarr.com/en/sonarr/quick-start-guide' },
        { label: 'Sonarr Settings Help', url: 'https://wiki.servarr.com/en/sonarr/settings' }
      ],
      contextValues: {
        'Root Folder': baseContext.mediaRoot + '/tv',
        'Downloads Folder': baseContext.downloadsPath,
        'Timezone': baseContext.timezone
      },
      specialNotes: previouslyCompletedServices.includes('plex')
        ? 'Sonarr manages TV downloads to: ' + baseContext.mediaRoot + '/tv'
        : 'Set up Plex first so Sonarr knows where your TV shows live.'
    },

    lidarr: {
      service: 'lidarr',
      title: 'Lidarr (Music Management) Setup',
      minimumSteps: [
        '1. Go to Settings → Media Management',
        '2. Set Root Folder to: ' + (baseContext.mediaRoot + '/music' || '/data/media/music'),
        '3. Go to Settings → Download Clients',
        '4. Add your download client (NZBGet or qBittorrent)',
        '5. Go to Settings → Indexers',
        '6. Go to Library → Import Existing Library (if you have existing music) or Search → Add Artist'
      ],
      externalLinks: [
        { label: 'Lidarr Setup Guide', url: 'https://wiki.servarr.com/en/lidarr/quick-start-guide' },
        { label: 'Lidarr Settings Help', url: 'https://wiki.servarr.com/en/lidarr/settings' }
      ],
      contextValues: {
        'Root Folder': baseContext.mediaRoot + '/music',
        'Downloads Folder': baseContext.downloadsPath,
        'Timezone': baseContext.timezone
      }
    },

    prowlarr: {
      service: 'prowlarr',
      title: 'Prowlarr (Indexer Management) Setup',
      minimumSteps: [
        '1. Go to Settings → Apps',
        '2. Add Radarr: Click "+" then select Radarr, enter Radarr URL: http://localhost:' + baseContext.radarrPort,
        '3. Add Sonarr: Click "+" then select Sonarr, enter Sonarr URL: http://localhost:' + baseContext.sonarrPort,
        '4. Go to Indexers → Add Indexer',
        '5. Search for public indexers or add your private ones',
        '6. Select indexers and sync them to Radarr/Sonarr',
        '7. Common free indexers: 1337x, ThePirateBay, KickAssTorrents (but check legal status in your region)'
      ],
      externalLinks: [
        { label: 'Prowlarr Setup Guide', url: 'https://wiki.servarr.com/en/prowlarr/quick-start-guide' },
        { label: 'Indexer Management', url: 'https://wiki.servarr.com/en/prowlarr/indexers' }
      ],
      contextValues: {
        'Radarr URL': 'http://localhost:' + baseContext.radarrPort,
        'Sonarr URL': 'http://localhost:' + baseContext.sonarrPort,
        'Timezone': baseContext.timezone
      },
      specialNotes: 'Prowlarr is your centralized indexer hub. Once connected, Radarr and Sonarr will automatically have access to all indexers.'
    },

    nzbget: {
      service: 'nzbget',
      title: 'NZBGet (Usenet Downloads) Setup',
      minimumSteps: [
        '1. IMPORTANT: You need the login details first - see "Get Credentials" below',
        '2. Go to Settings (gear icon, top right)',
        '3. Go to System → Control',
        '4. Set "Server port" if needed (default 6789)',
        '5. Go to Paths',
        '6. Set "MainDir" (main download directory): ' + baseContext.downloadsPath,
        '7. Go to Security → Authorization',
        '8. Change the default password to something secure',
        '9. Test by uploading a small NZB file to Downloads → Manual',
        '10. Verify download appears in the queue'
      ],
      externalLinks: [
        { label: 'NZBGet Documentation', url: 'https://nzbget.net/documentation' },
        { label: 'Get Initial NZBGet Credentials', url: '#get-nzbget-credentials' }
      ],
      contextValues: {
        'Download Folder': baseContext.downloadsPath,
        'Server Port': '6789',
        'Default Username': 'nzbget'
      },
      specialNotes: '⚠️ SPECIAL: NZBGet has a default password that is ONLY shown in Docker logs on first start. See "Get Credentials" button below to retrieve it.'
    },

    nzbgetMusic: {
      service: 'nzbgetMusic',
      title: 'NZBGet Music (Music Downloads) Setup',
      minimumSteps: [
        '1. IMPORTANT: You need the login details first - see "Get Credentials" below',
        '2. Go to Settings (gear icon, top right)',
        '3. Set MainDir: ' + (baseContext.mediaRoot + '/downloads/nzbget-music' || '/data/downloads/nzbget-music'),
        '4. Go to Security → Authorization and change the default password',
        '5. This instance is separate from your media NZBGet, so configure independently'
      ],
      externalLinks: [
        { label: 'NZBGet Documentation', url: 'https://nzbget.net/documentation' }
      ],
      contextValues: {
        'Download Folder': baseContext.downloadsPath + '/nzbget-music',
        'Server Port': '6790'
      },
      specialNotes: '⚠️ SPECIAL: This is a second instance of NZBGet dedicated to music. It has its own default password in Docker logs.'
    },

    qbittorrent: {
      service: 'qbittorrent',
      title: 'qBittorrent (BitTorrent Downloads) Setup',
      minimumSteps: [
        '1. IMPORTANT: Default credentials are admin:adminPassword - change these immediately',
        '2. Go to Tools → Options → Downloads',
        '3. Set "Default Save Path" to: ' + baseContext.downloadsPath,
        '4. Go to Connection',
        '5. Note down the listening port (if you want to access externally)',
        '6. Go to Speed',
        '7. Consider setting upload/download limits if on limited connection',
        '8. Go back and enable the torrent search plugin',
        '9. Test by adding a torrent'
      ],
      externalLinks: [
        { label: 'qBittorrent Official Site', url: 'https://www.qbittorrent.org/' },
        { label: 'qBittorrent Settings Guide', url: 'https://github.com/qbittorrent/qBittorrent/wiki' }
      ],
      contextValues: {
        'Download Folder': baseContext.downloadsPath,
        'Server Port': '8080',
        'Default Username': 'admin',
        'Default Password': 'adminPassword'
      },
      specialNotes: '⚠️ SECURITY: Change the default admin:adminPassword immediately to a strong password. This is exposed to your network!'
    },

    metube: {
      service: 'metube',
      title: 'MeTube (YouTube & Video Downloads) Setup',
      minimumSteps: [
        '1. Go to Settings (gear icon, bottom left)',
        '2. Set "Download folder" to: ' + baseContext.downloadsPath,
        '3. Set "Subtitle languages" (optional - e.g., en,es)',
        '4. Optionally set "Video format" (default is fine)',
        '5. Test by pasting a YouTube URL and downloading',
        '6. Verify file appears in: ' + baseContext.downloadsPath
      ],
      externalLinks: [
        { label: 'MeTube GitHub', url: 'https://github.com/alexta69/metube' }
      ],
      contextValues: {
        'Download Folder': baseContext.downloadsPath,
        'Server Port': '8081'
      },
      specialNotes: 'MeTube is the simplest to set up - just point it to your downloads folder and you\'re ready to go.'
    },

    overseerr: {
      service: 'overseerr',
      title: 'Overseerr (Media Requests) Setup',
      minimumSteps: [
        '1. Complete setup wizard (you should see it on first login)',
        '2. For "Movie requests", connect to Radarr: http://localhost:' + baseContext.radarrPort,
        '3. For "TV requests", connect to Sonarr: http://localhost:' + baseContext.sonarrPort,
        '4. Go to Settings → Users and create user accounts for family/friends',
        '5. Go to Settings → Notifications and set up alerts (email, Discord, etc. - optional)',
        '6. Test by submitting a movie or TV request'
      ],
      externalLinks: [
        { label: 'Overseerr Setup Guide', url: 'https://docs.overseerr.dev/getting-started/installation' },
        { label: 'Overseerr Configuration', url: 'https://docs.overseerr.dev/using-overseerr/settings' }
      ],
      contextValues: {
        'Radarr URL': 'http://localhost:' + baseContext.radarrPort,
        'Sonarr URL': 'http://localhost:' + baseContext.sonarrPort,
        'Plex Server': 'http://localhost:' + baseContext.plexPort
      },
      specialNotes: 'Overseerr is your user-friendly request hub. Family members use this, not Radarr/Sonarr directly.'
    },

    maintainerr: {
      service: 'maintainerr',
      title: 'Maintainerr (Collection Management) Setup',
      minimumSteps: [
        '1. Go to Settings (gear icon, top right)',
        '2. Add Radarr connection: URL http://localhost:' + baseContext.radarrPort,
        '3. Add Sonarr connection: URL http://localhost:' + baseContext.sonarrPort,
        '4. Go to Collections',
        '5. Create automated collections (e.g., "4K Movies", "Recently Added", "Popular")',
        '6. Set rules for collection membership (rating, year added, etc.)',
        '7. Review collections and push approved movies/shows to Plex'
      ],
      externalLinks: [
        { label: 'Maintainerr Setup Guide', url: 'https://docs.maintainerr.info/' }
      ],
      contextValues: {
        'Radarr URL': 'http://localhost:' + baseContext.radarrPort,
        'Sonarr URL': 'http://localhost:' + baseContext.sonarrPort
      },
      specialNotes: 'Maintainerr helps organize and manage your collections. This is optional but great for keeping your library clean.'
    },

    coordination: {
      service: 'coordination',
      title: 'Service Coordination Setup',
      minimumSteps: [
        '1. Gather API keys from each service:',
        '   - Radarr: Settings → General → API Key',
        '   - Sonarr: Settings → General → API Key',
        '   - Prowlarr: Settings → General → API Key',
        '   - Overseerr: Settings → Users & Profiles',
        '2. Click "Run Coordination" below to auto-connect services',
        '3. This will:',
        '   - Add Prowlarr indexers to Radarr and Sonarr',
        '   - Connect download clients to Radarr/Sonarr',
        '   - Link Overseerr to your request services'
      ],
      externalLinks: [
        { label: 'API Key Documentation', url: 'https://wiki.servarr.com/en/radarr/api' }
      ],
      contextValues: {},
      specialNotes: 'This step connects all services together. After this, most things should work automatically.'
    },

    validate: {
      service: 'validate',
      title: 'Final Validation',
      minimumSteps: [
        '1. Open each service and verify:',
        '   - Plex: Libraries are visible and scanned',
        '   - Radarr: Can search for movies',
        '   - Sonarr: Can search for shows',
        '   - Prowlarr: Indexers are listed and connected',
        '2. Test an actual request:',
        '   - Use Overseerr (or Radarr directly) to request a movie',
        '   - Check that it appears in the download client queue',
        '   - Wait for download to complete',
        '3. Verify in Plex that the new media appears after download'
      ],
      externalLinks: [
        { label: 'Troubleshooting Guide', url: 'https://wiki.servarr.com/en/useful-tools' }
      ],
      contextValues: {},
      specialNotes: 'If anything fails, check the logs in each service. The answer is almost always in the logs.'
    }
  };

  return instructions[service] || instructions.validate;
};

// Special handling for retrieving credentials from Docker logs
export const getDockerCredentials = async (serviceName: string): Promise<string> => {
  // This would be called to fetch credentials from backend
  // which would retrieve them from Docker logs
  // Format: { nzbget: { username: 'nzbget', password: 'xxxxx' }, ... }
  return `Credentials for ${serviceName}`;
};
