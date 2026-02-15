// Services configuration step with test connection

import React, { useState } from 'react';
import { api } from '../../services/api';

interface ServiceConfig {
  enabled: boolean;
  port: number;
  apiKey?: string;
}

interface TestResult {
  testing?: boolean;
  success: boolean;
  message: string;
}

interface Props {
  services: Record<string, ServiceConfig>;
  onChange: (services: Record<string, ServiceConfig>) => void;
}

const SERVICE_INFO: Record<string, { label: string; defaultPort: number; description: string }> = {
  plex:        { label: 'Plex',           defaultPort: 32400, description: 'Media streaming server' },
  radarr:      { label: 'Radarr',         defaultPort: 7878,  description: 'Movie management' },
  sonarr:      { label: 'Sonarr',         defaultPort: 8989,  description: 'TV show management' },
  lidarr:      { label: 'Lidarr',         defaultPort: 8686,  description: 'Music management' },
  prowlarr:    { label: 'Prowlarr',       defaultPort: 9696,  description: 'Indexer management' },
  overseerr:   { label: 'Overseerr',      defaultPort: 5055,  description: 'Media requests' },
  maintainerr: { label: 'Maintainerr',    defaultPort: 6246,  description: 'Collection management' },
  nzbget:      { label: 'NZBGet (Media)', defaultPort: 6789,  description: 'Usenet downloads for movies & TV' },
  nzbgetMusic: { label: 'NZBGet (Music)', defaultPort: 6790,  description: 'Usenet downloads for music' },
  qbittorrent: { label: 'qBittorrent',    defaultPort: 8080,  description: 'BitTorrent downloads' },
  metube:      { label: 'MeTube',         defaultPort: 8081,  description: 'YouTube & video downloads' },
};

export const ServicesStep: React.FC<Props> = ({ services, onChange }) => {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const toggle = (name: string) => {
    const svc = services[name];
    onChange({
      ...services,
      [name]: { ...svc, enabled: !svc.enabled },
    });
  };

  const updatePort = (name: string, port: number) => {
    onChange({
      ...services,
      [name]: { ...services[name], port },
    });
  };

  const testConnection = async (name: string) => {
    setTestResults(prev => ({ ...prev, [name]: { testing: true, success: false, message: 'Testing...' } }));
    try {
      const res = await api.post('/services/test', { service: name, port: services[name].port });
      const result = res.data;
      setTestResults(prev => ({ ...prev, [name]: result }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [name]: { testing: false, success: false, message: 'Request failed' } }));
    }
  };

  return (
    <div>
      <h2>Services</h2>
      <p>Enable the services you want in your stack. Ports can be customized.</p>
      {Object.entries(SERVICE_INFO).map(([name, info]) => {
        const svc = services[name];
        if (!svc) return null;
        const result = testResults[name];
        return (
          <div key={name} style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <label>
              <input type="checkbox" checked={svc.enabled} onChange={() => toggle(name)} />
              <strong style={{ marginLeft: 8 }}>{info.label}</strong>
              <span style={{ marginLeft: 8, color: '#888' }}>{info.description}</span>
            </label>
            {svc.enabled && (
              <div style={{ marginTop: 8, marginLeft: 24 }}>
                <label>
                  Port:{' '}
                  <input
                    type="number"
                    value={svc.port}
                    onChange={e => updatePort(name, parseInt(e.target.value, 10))}
                    style={{ width: 80 }}
                  />
                </label>
                <button onClick={() => testConnection(name)} style={{ marginLeft: 12 }}>
                  Test Connection
                </button>
                {result && !result.testing && (
                  <span style={{ marginLeft: 8, color: result.success ? 'green' : 'orange' }}>
                    {result.success ? '✓ Connected' : `⚠ ${result.message}`}
                  </span>
                )}
                {result?.testing && <span style={{ marginLeft: 8, color: '#888' }}>Testing…</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
