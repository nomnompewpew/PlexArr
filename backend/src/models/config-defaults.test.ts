// Test for config defaults including new services

import { createDefaultConfig } from './config-defaults';

describe('createDefaultConfig', () => {
  it('should include all required services', () => {
    const config = createDefaultConfig();
    
    expect(config.services.plex).toBeDefined();
    expect(config.services.radarr).toBeDefined();
    expect(config.services.sonarr).toBeDefined();
    expect(config.services.lidarr).toBeDefined();
    expect(config.services.prowlarr).toBeDefined();
    expect(config.services.overseerr).toBeDefined();
    expect(config.services.maintainerr).toBeDefined();
    expect(config.services.nzbget).toBeDefined();
  });

  it('should include new services (qbittorrent, metube, nzbgetMusic)', () => {
    const config = createDefaultConfig();
    
    expect(config.services.qbittorrent).toBeDefined();
    expect(config.services.qbittorrent?.enabled).toBe(false);
    expect(config.services.qbittorrent?.port).toBe(8080);
    
    expect(config.services.metube).toBeDefined();
    expect(config.services.metube?.enabled).toBe(false);
    expect(config.services.metube?.port).toBe(8081);
    
    expect(config.services.nzbgetMusic).toBeDefined();
    expect(config.services.nzbgetMusic?.enabled).toBe(false);
    expect(config.services.nzbgetMusic?.port).toBe(6790);
  });

  it('should set proper default ports', () => {
    const config = createDefaultConfig();
    
    expect(config.services.plex.port).toBe(32400);
    expect(config.services.radarr.port).toBe(7878);
    expect(config.services.sonarr.port).toBe(8989);
    expect(config.services.lidarr.port).toBe(8686);
    expect(config.services.prowlarr.port).toBe(9696);
    expect(config.services.overseerr.port).toBe(5055);
    expect(config.services.maintainerr.port).toBe(6246);
    expect(config.services.nzbget.port).toBe(6789);
  });

  it('should set qbittorrent and metube as disabled by default', () => {
    const config = createDefaultConfig();
    
    expect(config.services.qbittorrent?.enabled).toBe(false);
    expect(config.services.metube?.enabled).toBe(false);
    expect(config.services.nzbgetMusic?.enabled).toBe(false);
  });
});
