// Storage paths configuration step

import React, { useState } from 'react';

interface StoragePaths {
  mediaRoot: string;
  downloads: string;
  config: string;
  movies?: string;
  tv?: string;
  music?: string;
}

interface Props {
  paths: StoragePaths;
  onChange: (paths: StoragePaths) => void;
}

export const StorageStep: React.FC<Props> = ({ paths, onChange }) => {
  const [checking, setChecking] = useState<Record<string, any>>({});

  const checkPath = async (field: string, value: string) => {
    const res = await fetch('/api/config-new/check-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: value }),
    });
    const result = await res.json();
    setChecking(prev => ({ ...prev, [field]: result }));
  };

  const update = (field: keyof StoragePaths, value: string) => {
    onChange({ ...paths, [field]: value });
    if (value.startsWith('/')) checkPath(field, value);
  };

  const renderField = (label: string, field: keyof StoragePaths, placeholder: string, required = true) => {
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
      </div>
    );
  };

  return (
    <div>
      <h2>Storage Paths</h2>
      <p>Define where media, downloads, and config data are stored on your host.</p>
      {renderField('Media Root', 'mediaRoot', '/data/media')}
      {renderField('Downloads', 'downloads', '/data/downloads')}
      {renderField('Config Directory', 'config', '/opt/plexarr/config')}
      <h3>Optional: Per-Library Overrides</h3>
      <p>Leave blank to use: <code>{'{mediaRoot}'}/movies</code>, etc.</p>
      {renderField('Movies', 'movies', `${paths.mediaRoot}/movies`, false)}
      {renderField('TV Shows', 'tv', `${paths.mediaRoot}/tv`, false)}
      {renderField('Music', 'music', `${paths.mediaRoot}/music`, false)}
    </div>
  );
};
