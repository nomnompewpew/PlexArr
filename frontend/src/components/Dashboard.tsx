// Dashboard component for stack health monitoring

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CoordinationStatus, PlexArrConfig } from '../types/plexarr-config.types';

interface Container {
  name: string;
  service: string;
  state: string;
  status: string;
  health?: string;
  ports: string[];
}

interface StackStatus {
  name: string;
  status: string;
  containers: Container[];
}

interface ServiceLink {
  name: string;
  label: string;
  localUrl: string;
  publicUrl?: string;
  icon: string;
  enabled: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stackStatus, setStackStatus] = useState<StackStatus | null>(null);
  const [coordStatus, setCoordStatus] = useState<CoordinationStatus | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [controlAction, setControlAction] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboardAdvanced');
    return saved ? JSON.parse(saved) : false;
  });
  const [config, setConfig] = useState<PlexArrConfig | null>(null);

  // Service port mapping
  const servicePortMap: Record<string, { port: number; basePath?: string }> = {
    plex: { port: 32400, basePath: '/web' },
    radarr: { port: 7878 },
    sonarr: { port: 8989 },
    lidarr: { port: 8686 },
    prowlarr: { port: 9696 },
    overseerr: { port: 5055 },
    maintainerr: { port: 6246 },
    nzbget: { port: 6789 },
    nzbgetMusic: { port: 6790 },
    qbittorrent: { port: 8080 },
    metube: { port: 8081 },
    nginxProxyManager: { port: 81 }
  };

  // Friendly display names
  const serviceLabels: Record<string, string> = {
    plex: 'Plex Media Server',
    radarr: 'Radarr (Movies)',
    sonarr: 'Sonarr (TV)',
    lidarr: 'Lidarr (Music)',
    prowlarr: 'Prowlarr (Indexers)',
    overseerr: 'Overseerr (Requests)',
    maintainerr: 'Maintainerr',
    nzbget: 'NZBGet (Media)',
    nzbgetMusic: 'NZBGet (Music)',
    qbittorrent: 'qBittorrent',
    metube: 'MeTube (Downloads)',
    nginxProxyManager: 'Nginx Proxy Manager',
    wireguard: 'WireGuard (VPN)'
  };

  // Service icons/emojis
  const serviceIcons: Record<string, string> = {
    plex: '📺',
    radarr: '🎬',
    sonarr: '📺',
    lidarr: '🎵',
    prowlarr: '🔍',
    overseerr: '🎁',
    maintainerr: '🛠️',
    nzbget: '📥',
    nzbgetMusic: '🎵',
    qbittorrent: '⚡',
    metube: '📹',
    nginxProxyManager: '🔀',
    wireguard: '🔐'
  };

  const getServiceLinks = (): ServiceLink[] => {
    if (!config) return [];
    
    const links: ServiceLink[] = [];
    const publicDomain = config.network?.publicDomain;
    
    // Check each service
    const services: Array<[string, boolean]> = [
      ['plex', config.services.plex?.enabled || false],
      ['radarr', config.services.radarr?.enabled || false],
      ['sonarr', config.services.sonarr?.enabled || false],
      ['lidarr', config.services.lidarr?.enabled || false],
      ['prowlarr', config.services.prowlarr?.enabled || false],
      ['overseerr', config.services.overseerr?.enabled || false],
      ['maintainerr', config.services.maintainerr?.enabled || false],
      ['nzbget', config.services.nzbget?.enabled || false],
      ['nzbgetMusic', config.services.nzbgetMusic?.enabled || false],
      ['qbittorrent', config.services.qbittorrent?.enabled || false],
      ['metube', config.services.metube?.enabled || false],
      ['nginxProxyManager', config.services.nginxProxyManager?.enabled || false]
    ];

    services.forEach(([serviceName, enabled]) => {
      if (!enabled) return;
      
      const portInfo = servicePortMap[serviceName];
      if (!portInfo) return;

      const basePath = portInfo.basePath || '';
      const localUrl = `http://localhost:${portInfo.port}${basePath}`;
      
      let publicUrl: string | undefined;
      if (publicDomain) {
        if (serviceName === 'nginxProxyManager') {
          publicUrl = `https://${publicDomain}:81`;
        } else if (serviceName === 'plex') {
          publicUrl = `https://${publicDomain}${basePath}`;
        } else {
          publicUrl = `https://${publicDomain}`;
        }
      }

      links.push({
        name: serviceName,
        label: serviceLabels[serviceName] || serviceName,
        localUrl,
        publicUrl,
        icon: serviceIcons[serviceName] || '⚙️',
        enabled: true
      });
    });

    return links;
  };

  const refresh = async () => {
    try {
      const res = await api.get('/deploy-new/status');
      setStackStatus(res.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      // Try to fetch from /api/config-new first
      const res = await api.get('/config-new');
      setConfig(res.data);
    } catch (error) {
      // Config endpoint may not have data yet, that's ok
      console.debug('Config not yet available:', error);
    }
  };

  const toggleAdvanced = () => {
    const newValue = !showAdvanced;
    setShowAdvanced(newValue);
    localStorage.setItem('dashboardAdvanced', JSON.stringify(newValue));
  };

  const runCoordination = async () => {
    setCoordStatus({ running: true });
    try {
      const res = await api.post('/deploy-new/coordinate', {});
      setCoordStatus(res.data);
    } catch (error: any) {
      setCoordStatus({ 
        running: false, 
        error: error?.response?.data?.message || 'Coordination failed' 
      });
    }
  };

  const viewLogs = async (serviceName: string) => {
    setSelectedService(serviceName);
    setLoadingLogs(true);
    setLogs('');
    try {
      const res = await api.get(`/deploy-new/logs/${serviceName}?tail=200`);
      setLogs(res.data.logs || 'No logs available');
    } catch (error: any) {
      setLogs(`Error loading logs: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const viewAllLogs = async () => {
    setSelectedService('all');
    setLoadingLogs(true);
    setLogs('');
    try {
      const res = await api.get('/deploy-new/logs?tail=200');
      setLogs(res.data.logs || 'No logs available');
    } catch (error: any) {
      setLogs(`Error loading logs: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const controlStack = async (action: string) => {
    setControlAction(action);
    try {
      await api.post(`/deploy-new/control/${action}`);
      // Refresh status after action
      setTimeout(refresh, 2000);
    } catch (error: any) {
      alert(`Failed to ${action} stack: ${error?.response?.data?.message || error.message}`);
    } finally {
      setControlAction(null);
    }
  };

  useEffect(() => { 
    refresh();
    fetchConfig();
    const id = setInterval(refresh, 10000); 
    return () => clearInterval(id); 
  }, []);

  const getStatusColor = (state: string): string => {
    switch (state.toLowerCase()) {
      case 'running':
        return 'green';
      case 'exited':
      case 'stopped':
        return 'red';
      case 'created':
      case 'starting':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header with Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #dee2e6'
      }}>
        <div>
          <button 
            onClick={() => navigate('/wizard')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '12px',
              fontSize: '14px'
            }}
          >
            ← Back to Setup Wizard
          </button>
          <h2 style={{ margin: 0 }}>PlexArr Stack</h2>
          {stackStatus && (
            <p style={{ 
              margin: '5px 0', 
              fontSize: '14px',
              color: getStatusColor(stackStatus.status)
            }}>
              Status: <strong>{stackStatus.status}</strong> 
              {' '}({stackStatus.containers.length} container{stackStatus.containers.length !== 1 ? 's' : ''})
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <button 
            onClick={toggleAdvanced}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: showAdvanced ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            ⚙️ {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          <button 
            onClick={refresh}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Quick Links to Services */}
      {getServiceLinks().length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f0f8ff',
          borderLeft: '4px solid #0066cc',
          borderRadius: '4px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Quick Links to Services</h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {getServiceLinks().map((link) => (
              <div 
                key={link.name}
                style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {link.icon} {link.label}
                </div>
                <a 
                  href={link.localUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    fontSize: '12px',
                    wordBreak: 'break-all'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  localhost:{servicePortMap[link.name]?.port || '?'}
                </a>
                {link.publicUrl && (
                  <a 
                    href={link.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#28a745',
                      textDecoration: 'none',
                      fontSize: '12px',
                      wordBreak: 'break-all'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    📡 Public Domain
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings Section */}
      {showAdvanced && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px'
        }}>
          <h3 style={{ marginTop: 0 }}>Advanced Settings</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            {config?.system?.projectFolder && (
              <>Project Folder: <code>{config.system.projectFolder}</code></>
            )}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {config?.network?.publicDomain && (
              <>Public Domain: <code>{config.network.publicDomain}</code></>
            )}
          </p>
        </div>
      )}

      
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Stack Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => controlStack('start')}
            disabled={!!controlAction}
            style={{
              padding: '8px 16px',
              cursor: controlAction ? 'not-allowed' : 'pointer',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              opacity: controlAction ? 0.6 : 1
            }}
          >
            ▶️ Start
          </button>
          <button 
            onClick={() => controlStack('stop')}
            disabled={!!controlAction}
            style={{
              padding: '8px 16px',
              cursor: controlAction ? 'not-allowed' : 'pointer',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              opacity: controlAction ? 0.6 : 1
            }}
          >
            ⏸️ Stop
          </button>
          <button 
            onClick={() => controlStack('restart')}
            disabled={!!controlAction}
            style={{
              padding: '8px 16px',
              cursor: controlAction ? 'not-allowed' : 'pointer',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              opacity: controlAction ? 0.6 : 1
            }}
          >
            🔄 Restart
          </button>
          <button 
            onClick={() => controlStack('pull')}
            disabled={!!controlAction}
            style={{
              padding: '8px 16px',
              cursor: controlAction ? 'not-allowed' : 'pointer',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              opacity: controlAction ? 0.6 : 1
            }}
          >
            ⬇️ Pull Updates
          </button>
        </div>
        {controlAction && (
          <p style={{ marginTop: '10px', color: '#666' }}>
            Executing: {controlAction}...
          </p>
        )}
      </div>

      {/* Containers Table */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Containers</h3>
        {stackStatus && stackStatus.containers.length > 0 ? (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Service</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Container</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>State</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Ports</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stackStatus.containers.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{c.service}</td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{c.name}</td>
                  <td style={{ 
                    padding: '12px',
                    color: getStatusColor(c.state),
                    fontWeight: 'bold'
                  }}>
                    {c.state}
                    {c.health && ` (${c.health})`}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{c.status}</td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {c.ports.length > 0 ? c.ports.join(', ') : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => viewLogs(c.service)}
                      style={{
                        padding: '4px 12px',
                        cursor: 'pointer',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      📋 Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666' }}>No containers running. Deploy your stack first.</p>
        )}
      </div>

      {/* Logs Viewer */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Logs {selectedService && `- ${selectedService}`}</h3>
          <button 
            onClick={viewAllLogs}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            View All Logs
          </button>
        </div>
        
        {loadingLogs ? (
          <p>Loading logs...</p>
        ) : logs ? (
          <pre style={{ 
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '12px',
            fontFamily: 'Consolas, Monaco, monospace'
          }}>
            {logs}
          </pre>
        ) : (
          <p style={{ color: '#666' }}>Select a container to view logs</p>
        )}
      </div>

      {/* Service Coordination */}
      <div style={{ 
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Service Coordination</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Connect services by sharing API keys between Radarr, Sonarr, Prowlarr, and Overseerr.
        </p>
        <button 
          onClick={runCoordination} 
          disabled={coordStatus?.running}
          style={{
            padding: '8px 16px',
            cursor: coordStatus?.running ? 'not-allowed' : 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            opacity: coordStatus?.running ? 0.6 : 1
          }}
        >
          {coordStatus?.running ? '⏳ Running…' : '🔗 Run Coordination'}
        </button>
        {coordStatus && !coordStatus.running && (
          <pre style={{ 
            marginTop: '15px',
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            border: '1px solid #dee2e6',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {JSON.stringify(coordStatus, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
