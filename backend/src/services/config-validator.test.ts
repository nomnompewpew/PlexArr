// Tests for config validator security and correctness

import { validateConfig } from './config-validator';
import { createDefaultConfig } from '../models/config-defaults';
import { PlexArrConfig } from '../models/config';

function makeConfig(overrides: Partial<PlexArrConfig> = {}): PlexArrConfig {
  return { ...createDefaultConfig(), ...overrides };
}

describe('validateConfig - storage paths', () => {
  it('should pass with valid absolute paths', () => {
    const config = makeConfig();
    const errors = validateConfig(config);
    expect(errors.filter(e => e.field.startsWith('storage'))).toHaveLength(0);
  });

  it('should reject non-absolute storage paths', () => {
    const config = makeConfig();
    config.storage.mediaRoot = 'relative/path';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'storage.mediaRoot')).toBe(true);
  });

  it('should reject paths with shell injection characters (semicolon)', () => {
    const config = makeConfig();
    config.storage.mediaRoot = '/data/media; rm -rf /';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'storage.mediaRoot')).toBe(true);
  });

  it('should reject paths with shell injection characters (backtick)', () => {
    const config = makeConfig();
    config.storage.downloads = '/data/`whoami`';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'storage.downloads')).toBe(true);
  });

  it('should reject paths with shell injection characters (dollar sign)', () => {
    const config = makeConfig();
    config.storage.config = '/opt/$(evil)';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'storage.config')).toBe(true);
  });

  it('should allow paths with dots, hyphens, and underscores', () => {
    const config = makeConfig();
    config.storage.mediaRoot = '/data/my_media-dir.v2';
    const errors = validateConfig(config);
    expect(errors.filter(e => e.field === 'storage.mediaRoot')).toHaveLength(0);
  });
});

describe('validateConfig - system paths', () => {
  it('should reject projectFolder with shell injection characters', () => {
    const config = makeConfig();
    config.system.projectFolder = '/opt/plexarr; rm -rf /';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'system.projectFolder')).toBe(true);
  });

  it('should reject non-absolute projectFolder', () => {
    const config = makeConfig();
    config.system.projectFolder = 'opt/plexarr';
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'system.projectFolder')).toBe(true);
  });

  it('should pass with valid projectFolder', () => {
    const config = makeConfig();
    config.system.projectFolder = '/opt/plexarr';
    const errors = validateConfig(config);
    expect(errors.filter(e => e.field === 'system.projectFolder')).toHaveLength(0);
  });
});

describe('validateConfig - PUID/PGID', () => {
  it('should reject PUID of 0', () => {
    const config = makeConfig();
    config.system.puid = 0;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'system.puid')).toBe(true);
  });

  it('should reject negative PUID', () => {
    const config = makeConfig();
    config.system.puid = -1;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'system.puid')).toBe(true);
  });

  it('should reject non-integer PUID', () => {
    const config = makeConfig();
    config.system.puid = 1.5;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'system.puid')).toBe(true);
  });

  it('should accept valid PUID/PGID', () => {
    const config = makeConfig();
    config.system.puid = 1000;
    config.system.pgid = 1000;
    const errors = validateConfig(config);
    expect(errors.filter(e => e.field === 'system.puid' || e.field === 'system.pgid')).toHaveLength(0);
  });
});

describe('validateConfig - port range', () => {
  it('should reject port 0', () => {
    const config = makeConfig();
    config.services.radarr.port = 0;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'services.radarr.port')).toBe(true);
  });

  it('should reject port above 65535', () => {
    const config = makeConfig();
    config.services.sonarr.port = 99999;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'services.sonarr.port')).toBe(true);
  });

  it('should reject non-integer port', () => {
    const config = makeConfig();
    config.services.radarr.port = 78.5;
    const errors = validateConfig(config);
    expect(errors.some(e => e.field === 'services.radarr.port')).toBe(true);
  });

  it('should detect port conflicts between enabled services', () => {
    const config = makeConfig();
    config.services.radarr.port = 8989;   // same as sonarr default
    config.services.sonarr.port = 8989;
    const errors = validateConfig(config);
    const conflictErrors = errors.filter(e => e.message.includes('conflicts'));
    // Exactly one conflict error is raised (the second service to claim the port)
    expect(conflictErrors).toHaveLength(1);
    expect(conflictErrors[0].field).toBe('services.sonarr.port');
  });

  it('should pass for valid unique ports', () => {
    const config = makeConfig();
    const errors = validateConfig(config);
    expect(errors.filter(e => e.message.includes('conflicts'))).toHaveLength(0);
  });
});
