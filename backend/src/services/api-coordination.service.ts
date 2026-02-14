import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to automatically coordinate API keys and connections between Arr services
 * All services communicate via Docker network using container names
 */
export class ApiCoordinationService {
  
  /**
   * Extract or generate API key from an Arr service (Radarr, Sonarr, Lidarr, Prowlarr)
   */
  async getOrCreateArrApiKey(serviceUrl: string): Promise<string> {
    try {
      // Try to get config.xml which contains the API key
      const configResponse = await axios.get(`${serviceUrl}/api/v3/config/host`, {
        timeout: 5000,
        validateStatus: () => true // Accept any status
      });

      if (configResponse.data?.apiKey) {
        return configResponse.data.apiKey;
      }

      // If we can't get it via API, we need to read it from the config file
      // This will be done via the container's mounted volume
      throw new Error('API key not accessible via API - needs manual extraction from config');
    } catch (error) {
      console.error(`Error getting API key from ${serviceUrl}:`, error);
      throw error;
    }
  }

  /**
   * Add Prowlarr as an indexer source to Radarr
   */
  async connectProwlarrToRadarr(
    radarrUrl: string,
    radarrApiKey: string,
    prowlarrUrl: string,
    prowlarrApiKey: string
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: radarrUrl,
        headers: { 'X-Api-Key': radarrApiKey }
      });

      // Check if Prowlarr is already connected
      const existingApps = await client.get('/api/v3/applications');
      const prowlarrExists = existingApps.data.some((app: any) => 
        app.implementation === 'Prowlarr'
      );

      if (prowlarrExists) {
        console.log('Prowlarr already connected to Radarr');
        return;
      }

      // Add Prowlarr as application
      const prowlarrApp = {
        name: 'Prowlarr',
        implementation: 'Prowlarr',
        configContract: 'ProwlarrSettings',
        fields: [
          { name: 'prowlarrUrl', value: prowlarrUrl },
          { name: 'apiKey', value: prowlarrApiKey },
          { name: 'syncCategories', value: [2000, 2010, 2020, 2030, 2040, 2045, 2050, 2060] } // Movie categories
        ],
        tags: []
      };

      await client.post('/api/v3/applications', prowlarrApp);
      console.log('Successfully connected Prowlarr to Radarr');
    } catch (error) {
      console.error('Error connecting Prowlarr to Radarr:', error);
      throw error;
    }
  }

  /**
   * Add Prowlarr as an indexer source to Sonarr
   */
  async connectProwlarrToSonarr(
    sonarrUrl: string,
    sonarrApiKey: string,
    prowlarrUrl: string,
    prowlarrApiKey: string
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: sonarrUrl,
        headers: { 'X-Api-Key': sonarrApiKey }
      });

      const existingApps = await client.get('/api/v3/applications');
      const prowlarrExists = existingApps.data.some((app: any) => 
        app.implementation === 'Prowlarr'
      );

      if (prowlarrExists) {
        console.log('Prowlarr already connected to Sonarr');
        return;
      }

      const prowlarrApp = {
        name: 'Prowlarr',
        implementation: 'Prowlarr',
        configContract: 'ProwlarrSettings',
        fields: [
          { name: 'prowlarrUrl', value: prowlarrUrl },
          { name: 'apiKey', value: prowlarrApiKey },
          { name: 'syncCategories', value: [5000, 5010, 5020, 5030, 5040, 5045, 5050] } // TV categories
        ],
        tags: []
      };

      await client.post('/api/v3/applications', prowlarrApp);
      console.log('Successfully connected Prowlarr to Sonarr');
    } catch (error) {
      console.error('Error connecting Prowlarr to Sonarr:', error);
      throw error;
    }
  }

  /**
   * Add Prowlarr as an indexer source to Lidarr
   */
  async connectProwlarrToLidarr(
    lidarrUrl: string,
    lidarrApiKey: string,
    prowlarrUrl: string,
    prowlarrApiKey: string
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: lidarrUrl,
        headers: { 'X-Api-Key': lidarrApiKey }
      });

      const existingApps = await client.get('/api/v1/applications');
      const prowlarrExists = existingApps.data.some((app: any) => 
        app.implementation === 'Prowlarr'
      );

      if (prowlarrExists) {
        console.log('Prowlarr already connected to Lidarr');
        return;
      }

      const prowlarrApp = {
        name: 'Prowlarr',
        implementation: 'Prowlarr',
        configContract: 'ProwlarrSettings',
        fields: [
          { name: 'prowlarrUrl', value: prowlarrUrl },
          { name: 'apiKey', value: prowlarrApiKey },
          { name: 'syncCategories', value: [3000, 3010, 3020, 3030, 3040] } // Music categories
        ],
        tags: []
      };

      await client.post('/api/v1/applications', prowlarrApp);
      console.log('Successfully connected Prowlarr to Lidarr');
    } catch (error) {
      console.error('Error connecting Prowlarr to Lidarr:', error);
      throw error;
    }
  }

  /**
   * Add Radarr and Sonarr to Prowlarr
   */
  async registerArrAppsToProwlarr(
    prowlarrUrl: string,
    prowlarrApiKey: string,
    apps: Array<{ name: string; url: string; apiKey: string; type: 'radarr' | 'sonarr' | 'lidarr' }>
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: prowlarrUrl,
        headers: { 'X-Api-Key': prowlarrApiKey }
      });

      for (const app of apps) {
        // Check if already registered
        const existingApps = await client.get('/api/v1/applications');
        const appExists = existingApps.data.some((a: any) => 
          a.name === app.name
        );

        if (appExists) {
          console.log(`${app.name} already registered in Prowlarr`);
          continue;
        }

        // Determine sync categories based on type
        let syncCategories: number[] = [];
        let apiVersion = 'v3';
        
        if (app.type === 'radarr') {
          syncCategories = [2000, 2010, 2020, 2030, 2040, 2045, 2050, 2060];
        } else if (app.type === 'sonarr') {
          syncCategories = [5000, 5010, 5020, 5030, 5040, 5045, 5050];
        } else if (app.type === 'lidarr') {
          syncCategories = [3000, 3010, 3020, 3030, 3040];
          apiVersion = 'v1';
        }

        const appConfig = {
          name: app.name,
          implementation: app.type.charAt(0).toUpperCase() + app.type.slice(1),
          configContract: `${app.type.charAt(0).toUpperCase() + app.type.slice(1)}Settings`,
          fields: [
            { name: 'baseUrl', value: app.url },
            { name: 'apiKey', value: app.apiKey },
            { name: 'syncCategories', value: syncCategories }
          ],
          tags: [],
          syncLevel: 'addAndRemove'
        };

        await client.post('/api/v1/applications', appConfig);
        console.log(`Successfully registered ${app.name} to Prowlarr`);
      }
    } catch (error) {
      console.error('Error registering apps to Prowlarr:', error);
      throw error;
    }
  }

  /**
   * Add NZBGet as download client to Radarr
   */
  async addNzbgetToRadarr(
    radarrUrl: string,
    radarrApiKey: string,
    nzbgetUrl: string,
    nzbgetUsername: string = 'nzbget',
    nzbgetPassword: string = 'tegbzn6789'
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: radarrUrl,
        headers: { 'X-Api-Key': radarrApiKey }
      });

      const existingClients = await client.get('/api/v3/downloadclient');
      const nzbgetExists = existingClients.data.some((dc: any) => 
        dc.implementation === 'NzbGet' && dc.name === 'NZBGet'
      );

      if (nzbgetExists) {
        console.log('NZBGet already configured in Radarr');
        return;
      }

      const nzbgetClient = {
        enable: true,
        protocol: 'usenet',
        priority: 1,
        name: 'NZBGet',
        implementation: 'NzbGet',
        configContract: 'NzbGetSettings',
        fields: [
          { name: 'host', value: nzbgetUrl.replace('http://', '').replace('https://', '') },
          { name: 'port', value: 6789 },
          { name: 'username', value: nzbgetUsername },
          { name: 'password', value: nzbgetPassword },
          { name: 'movieCategory', value: 'movies' },
          { name: 'recentMoviePriority', value: 0 },
          { name: 'olderMoviePriority', value: 0 },
          { name: 'useSsl', value: false }
        ],
        tags: []
      };

      await client.post('/api/v3/downloadclient', nzbgetClient);
      console.log('Successfully added NZBGet to Radarr');
    } catch (error) {
      console.error('Error adding NZBGet to Radarr:', error);
      throw error;
    }
  }

  /**
   * Add NZBGet as download client to Sonarr
   */
  async addNzbgetToSonarr(
    sonarrUrl: string,
    sonarrApiKey: string,
    nzbgetUrl: string,
    nzbgetUsername: string = 'nzbget',
    nzbgetPassword: string = 'tegbzn6789'
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: sonarrUrl,
        headers: { 'X-Api-Key': sonarrApiKey }
      });

      const existingClients = await client.get('/api/v3/downloadclient');
      const nzbgetExists = existingClients.data.some((dc: any) => 
        dc.implementation === 'NzbGet' && dc.name === 'NZBGet'
      );

      if (nzbgetExists) {
        console.log('NZBGet already configured in Sonarr');
        return;
      }

      const nzbgetClient = {
        enable: true,
        protocol: 'usenet',
        priority: 1,
        name: 'NZBGet',
        implementation: 'NzbGet',
        configContract: 'NzbGetSettings',
        fields: [
          { name: 'host', value: nzbgetUrl.replace('http://', '').replace('https://', '') },
          { name: 'port', value: 6789 },
          { name: 'username', value: nzbgetUsername },
          { name: 'password', value: nzbgetPassword },
          { name: 'tvCategory', value: 'tv' },
          { name: 'recentTvPriority', value: 0 },
          { name: 'olderTvPriority', value: 0 },
          { name: 'useSsl', value: false }
        ],
        tags: []
      };

      await client.post('/api/v3/downloadclient', nzbgetClient);
      console.log('Successfully added NZBGet to Sonarr');
    } catch (error) {
      console.error('Error adding NZBGet to Sonarr:', error);
      throw error;
    }
  }

  /**
   * Configure Overseerr with Plex, Radarr, and Sonarr
   */
  async configureOverseerr(
    overseerrUrl: string,
    plexUrl: string,
    plexToken: string,
    radarrUrl: string,
    radarrApiKey: string,
    sonarrUrl: string,
    sonarrApiKey: string
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: overseerrUrl,
        headers: { 'Content-Type': 'application/json' }
      });

      // Initialize Overseerr if needed
      const status = await client.get('/api/v1/status');
      
      if (!status.data.initialized) {
        // Set up Plex
        await client.post('/api/v1/auth/plex', {
          authToken: plexToken
        });

        // Configure Plex settings
        await client.post('/api/v1/settings/plex', {
          name: 'Plex',
          ip: plexUrl.replace('http://', '').replace('https://', '').split(':')[0],
          port: parseInt(plexUrl.split(':').pop() || '32400'),
          useSsl: plexUrl.startsWith('https'),
          libraries: []
        });

        // Add Radarr
        await client.post('/api/v1/settings/radarr', {
          name: 'Radarr',
          hostname: radarrUrl.replace('http://', '').replace('https://', '').split(':')[0],
          port: parseInt(radarrUrl.split(':').pop() || '7878'),
          apiKey: radarrApiKey,
          useSsl: radarrUrl.startsWith('https'),
          baseUrl: '',
          activeProfileId: 1,
          activeDirectory: '/movies',
          is4k: false,
          minimumAvailability: 'announced',
          tags: [],
          isDefault: true,
          externalUrl: '',
          syncEnabled: true
        });

        // Add Sonarr
        await client.post('/api/v1/settings/sonarr', {
          name: 'Sonarr',
          hostname: sonarrUrl.replace('http://', '').replace('https://', '').split(':')[0],
          port: parseInt(sonarrUrl.split(':').pop() || '8989'),
          apiKey: sonarrApiKey,
          useSsl: sonarrUrl.startsWith('https'),
          baseUrl: '',
          activeProfileId: 1,
          activeDirectory: '/tv',
          activeAnimeProfileId: null,
          activeAnimeDirectory: null,
          is4k: false,
          tags: [],
          animeTags: [],
          isDefault: true,
          externalUrl: '',
          syncEnabled: true
        });

        console.log('Successfully configured Overseerr');
      } else {
        console.log('Overseerr already initialized');
      }
    } catch (error) {
      console.error('Error configuring Overseerr:', error);
      throw error;
    }
  }

  /**
   * Configure Maintainerr with Plex connection
   */
  async configureMaintainerr(
    maintainerrUrl: string,
    plexUrl: string,
    plexToken: string
  ): Promise<void> {
    try {
      const client = axios.create({
        baseURL: maintainerrUrl,
        headers: { 'Content-Type': 'application/json' }
      });

      // Configure Plex connection in Maintainerr
      await client.post('/api/settings', {
        plexUrl: plexUrl,
        plexToken: plexToken
      });

      console.log('Successfully configured Maintainerr');
    } catch (error) {
      console.error('Error configuring Maintainerr:', error);
      // Maintainerr might not have API initially, this is expected
      console.log('Maintainerr will need manual Plex connection on first login');
    }
  }

  /**
   * Orchestrate all API connections automatically
   */
  async coordinateAllServices(config: {
    radarr?: { url: string; apiKey: string };
    sonarr?: { url: string; apiKey: string };
    lidarr?: { url: string; apiKey: string };
    prowlarr?: { url: string; apiKey: string };
    overseerr?: { url: string };
    maintainerr?: { url: string };
    plex?: { url: string; token: string };
    nzbget?: { url: string; username?: string; password?: string };
  }): Promise<void> {
    const results: string[] = [];

    try {
      // Step 1: Connect Prowlarr to all Arr apps
      if (config.prowlarr && config.radarr) {
        await this.connectProwlarrToRadarr(
          config.radarr.url,
          config.radarr.apiKey,
          config.prowlarr.url,
          config.prowlarr.apiKey
        );
        results.push('✓ Connected Prowlarr to Radarr');
      }

      if (config.prowlarr && config.sonarr) {
        await this.connectProwlarrToSonarr(
          config.sonarr.url,
          config.sonarr.apiKey,
          config.prowlarr.url,
          config.prowlarr.apiKey
        );
        results.push('✓ Connected Prowlarr to Sonarr');
      }

      if (config.prowlarr && config.lidarr) {
        await this.connectProwlarrToLidarr(
          config.lidarr.url,
          config.lidarr.apiKey,
          config.prowlarr.url,
          config.prowlarr.apiKey
        );
        results.push('✓ Connected Prowlarr to Lidarr');
      }

      // Step 2: Register Arr apps in Prowlarr
      if (config.prowlarr) {
        const apps: Array<{ name: string; url: string; apiKey: string; type: 'radarr' | 'sonarr' | 'lidarr' }> = [];
        
        if (config.radarr) {
          apps.push({ name: 'Radarr', url: config.radarr.url, apiKey: config.radarr.apiKey, type: 'radarr' });
        }
        if (config.sonarr) {
          apps.push({ name: 'Sonarr', url: config.sonarr.url, apiKey: config.sonarr.apiKey, type: 'sonarr' });
        }
        if (config.lidarr) {
          apps.push({ name: 'Lidarr', url: config.lidarr.url, apiKey: config.lidarr.apiKey, type: 'lidarr' });
        }

        if (apps.length > 0) {
          await this.registerArrAppsToProwlarr(
            config.prowlarr.url,
            config.prowlarr.apiKey,
            apps
          );
          results.push('✓ Registered Arr apps in Prowlarr');
        }
      }

      // Step 3: Add download clients
      if (config.nzbget) {
        if (config.radarr) {
          await this.addNzbgetToRadarr(
            config.radarr.url,
            config.radarr.apiKey,
            config.nzbget.url,
            config.nzbget.username,
            config.nzbget.password
          );
          results.push('✓ Added NZBGet to Radarr');
        }

        if (config.sonarr) {
          await this.addNzbgetToSonarr(
            config.sonarr.url,
            config.sonarr.apiKey,
            config.nzbget.url,
            config.nzbget.username,
            config.nzbget.password
          );
          results.push('✓ Added NZBGet to Sonarr');
        }
      }

      // Step 4: Configure Overseerr
      if (config.overseerr && config.plex && config.radarr && config.sonarr) {
        await this.configureOverseerr(
          config.overseerr.url,
          config.plex.url,
          config.plex.token,
          config.radarr.url,
          config.radarr.apiKey,
          config.sonarr.url,
          config.sonarr.apiKey
        );
        results.push('✓ Configured Overseerr');
      }

      // Step 5: Configure Maintainerr
      if (config.maintainerr && config.plex) {
        await this.configureMaintainerr(
          config.maintainerr.url,
          config.plex.url,
          config.plex.token
        );
        results.push('✓ Configured Maintainerr');
      }

      console.log('API Coordination Complete:');
      results.forEach(r => console.log(r));

      return;
    } catch (error) {
      console.error('Error during API coordination:', error);
      throw error;
    }
  }
}
