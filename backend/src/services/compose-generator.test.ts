// Test for compose generator with new services

import { generateCompose } from './compose-generator';
import { createDefaultConfig } from '../models/config-defaults';
import * as yaml from 'js-yaml';

describe('generateCompose', () => {
  it('should generate compose file for all enabled services', () => {
    const config = createDefaultConfig();
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.plex).toBeDefined();
    expect(parsed.services.radarr).toBeDefined();
    expect(parsed.services.sonarr).toBeDefined();
    expect(parsed.services.prowlarr).toBeDefined();
    expect(parsed.services.overseerr).toBeDefined();
    expect(parsed.services.maintainerr).toBeDefined();
    expect(parsed.services.nzbget).toBeDefined();
  });

  it('should include qbittorrent when enabled', () => {
    const config = createDefaultConfig();
    config.services.qbittorrent!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.qbittorrent).toBeDefined();
    expect(parsed.services.qbittorrent.image).toBe('lscr.io/linuxserver/qbittorrent:latest');
    expect(parsed.services.qbittorrent.container_name).toBe('qbittorrent');
    expect(parsed.services.qbittorrent.ports).toContain('8080:8080');
  });

  it('should include metube when enabled', () => {
    const config = createDefaultConfig();
    config.services.metube!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.metube).toBeDefined();
    expect(parsed.services.metube.image).toBe('ghcr.io/alexta69/metube:latest');
    expect(parsed.services.metube.container_name).toBe('metube');
    expect(parsed.services.metube.ports).toContain('8081:8081');
  });

  it('should include nzbgetMusic when enabled', () => {
    const config = createDefaultConfig();
    config.services.nzbgetMusic!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.nzbgetMusic).toBeDefined();
    expect(parsed.services.nzbgetMusic.image).toBe('lscr.io/linuxserver/nzbget:latest');
    expect(parsed.services.nzbgetMusic.container_name).toBe('nzbget-music');
    expect(parsed.services.nzbgetMusic.ports).toContain('6790:6789');
  });

  it('should not include disabled services', () => {
    const config = createDefaultConfig();
    // qbittorrent, metube, nzbgetMusic are disabled by default
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.qbittorrent).toBeUndefined();
    expect(parsed.services.metube).toBeUndefined();
    expect(parsed.services.nzbgetMusic).toBeUndefined();
  });

  it('should configure proper volumes for qbittorrent', () => {
    const config = createDefaultConfig();
    config.services.qbittorrent!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.qbittorrent.volumes).toContain('/opt/plexarr/config/qbittorrent:/config');
    expect(parsed.services.qbittorrent.volumes).toContain('/data/downloads:/downloads');
  });

  it('should configure proper volumes for nzbgetMusic', () => {
    const config = createDefaultConfig();
    config.services.nzbgetMusic!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.nzbgetMusic.volumes).toContain('/opt/plexarr/config/nzbget-music:/config');
    expect(parsed.services.nzbgetMusic.volumes).toContain('/data/downloads/music:/downloads');
  });

  it('should set environment variables for new services', () => {
    const config = createDefaultConfig();
    config.services.qbittorrent!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.qbittorrent.environment.PUID).toBe('1000');
    expect(parsed.services.qbittorrent.environment.PGID).toBe('1000');
    expect(parsed.services.qbittorrent.environment.TZ).toBe('America/New_York');
  });

  it('should attach new services to plexarr_default network', () => {
    const config = createDefaultConfig();
    config.services.qbittorrent!.enabled = true;
    config.services.metube!.enabled = true;
    config.services.nzbgetMusic!.enabled = true;
    
    const compose = generateCompose(config);
    const parsed = yaml.load(compose) as any;
    
    expect(parsed.services.qbittorrent.networks).toContain('plexarr_default');
    expect(parsed.services.metube.networks).toContain('plexarr_default');
    expect(parsed.services.nzbgetMusic.networks).toContain('plexarr_default');
  });
});
