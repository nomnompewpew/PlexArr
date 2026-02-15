// Storage paths configuration step

import React, { useState } from 'react';
import { api } from '../../services/api';
import { ContextLabel } from '../ContextLabel';

interface StoragePaths {
  mediaRoot: string;
  downloads: string;
  config: string;
  movies?: string;
  tv?: string;
  music?: string;
}

interface PathCheckResult {
  exists: boolean;
  isDirectory: boolean;
  writable: boolean;
}

interface Props {
  paths: StoragePaths;
  onChange: (paths: StoragePaths) => void;
}

export const StorageStep: React.FC<Props> = ({ paths, onChange }) => {
  const [checking, setChecking] = useState<Record<string, PathCheckResult>>({});

  const checkPath = async (field: string, value: string) => {
    try {
      const res = await api.post('/config-new/check-path', { path: value });
      const result = res.data;
      setChecking(prev => ({ ...prev, [field]: result }));
    } catch (err) {
      console.error('Error checking path:', err);
      setChecking(prev => ({ ...prev, [field]: { exists: false, isDirectory: false, writable: false } }));
    }
  };

  const update = (field: keyof StoragePaths, value: string) => {
    onChange({ ...paths, [field]: value });
    if (value.startsWith('/')) checkPath(field, value);
  };

  const renderField = (label: string, field: keyof StoragePaths, placeholder: string, required = true, contextType: 'user-config' | 'advanced' = 'user-config', contextText?: string) => {
    const status = checking[field];
    return (
      <div style={{ marginBottom: 16 }}>
        <label>{label} {required && <span style={{ color: 'red' }}>*</span>}</label>
        <input
          type="text"
          value={paths[field] || ''}
          placeholder={placeholder}
          onChange={e => update(field, e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
        {status && (
          <small style={{ color: status.exists && status.writable ? 'green' : 'orange' }}>
            {status.exists
              ? status.writable ? '✓ Path exists and is writable' : '⚠ Path exists but is not writable'
              : '⚠ Path does not exist — it will be created on deploy'}
          </small>
        )}
        {contextText && <ContextLabel type={contextType} text={contextText} />}
      </div>
    );
  };

  return (
    <div>
      <h2>Storage Paths</h2>
      <p>Define where media, downloads, and config data are stored on your host.</p>
      
      <div style={{ marginBottom: 24 }}>
        <h3>Core Paths</h3>
        {renderField('Media Root', 'mediaRoot', '/data/media', true, 'user-config', 'Your actual folder on the host where all your media is stored')}
        {renderField('Downloads', 'downloads', '/data/downloads', true, 'user-config', 'The folder where services will save downloaded files you specify')}
        {renderField('Config Directory', 'config', '/opt/plexarr/config', true, 'user-config', 'Where PlexArr stores service configuration files')}
      </div>

      <div>
        <h3>Optional: Per-Library Overrides</h3>
        <p>Leave blank to use: <code>{'{mediaRoot}'}/movies</code>, etc.</p>
        <ContextLabel type="advanced" text="Only customize these if your movies, TV, and music are in completely different locations on your drive" />
        {renderField('Movies', 'movies', `${paths.mediaRoot}/movies`, false, 'advanced', 'Separate path for movie files (optional)')}
        {renderField('TV Shows', 'tv', `${paths.mediaRoot}/tv`, false, 'advanced', 'Separate path for TV show files (optional)')}
        {renderField('Music', 'music', `${paths.mediaRoot}/music`, false, 'advanced', 'Separate path for music files (optional)')}
      </div>
    </div>
  );
};
