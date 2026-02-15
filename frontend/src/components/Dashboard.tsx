// Dashboard component for stack health monitoring

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CoordinationStatus, PlexArrConfig } from '../types/plexarr-config.types';
import RequestBar, { RequestType } from './RequestBar';
import RequestModal from './RequestModal';
import ServiceIframe from './ServiceIframe';

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
  const [selectedTab, setSelectedTab] = useState<string>('plex');
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [controlAction, setControlAction] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboardAdvanced');
    return saved ? JSON.parse(saved) : false;
  });
  const [config, setConfig] = useState<PlexArrConfig | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('movies');
  const [requestQuery, setRequestQuery] = useState('');

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

  const getEnabledTabs = (): Array<{ key: string; label: string; icon: string; port: number; basePath?: string }> => {
    if (!config) return [];

    const tabs: Array<{ key: string; label: string; icon: string; port: number; basePath?: string }> = [];
    
    const serviceConfigs: Array<[string, boolean | undefined, string, string, number, string?]> = [
      ['plex', config.services.plex?.enabled, 'Plex', '📺', 32400, '/web'],
      ['radarr', config.services.radarr?.enabled, 'Radarr', '🎬', 7878],
      ['sonarr', config.services.sonarr?.enabled, 'Sonarr', '📺', 8989],
      ['lidarr', config.services.lidarr?.enabled, 'Lidarr', '🎵', 8686],
      ['prowlarr', config.services.prowlarr?.enabled, 'Prowlarr', '🔍', 9696],
      ['overseerr', config.services.overseerr?.enabled, 'Overseerr', '🎁', 5055],
      ['maintainerr', config.services.maintainerr?.enabled, 'Maintainerr', '🛠️', 6246],
      ['nzbget', config.services.nzbget?.enabled, 'NZBGet', '📥', 6789],
      ['nzbgetMusic', config.services.nzbgetMusic?.enabled, 'NZBGet (Music)', '🎵', 6790],
      ['qbittorrent', config.services.qbittorrent?.enabled, 'qBittorrent', '⚡', 8080],
      ['metube', config.services.metube?.enabled, 'MeTube', '📹', 8081],
      ['nginxProxyManager', config.services.nginxProxyManager?.enabled, 'Nginx PM', '🔀', 81]
    ];

    serviceConfigs.forEach(([key, enabled, label, icon, port, basePath]) => {
      if (enabled) {
        tabs.push({ key, label, icon, port, basePath });
      }
    });

    return tabs;
  };

  const handleRequestSubmit = (type: RequestType, query: string) => {
    setRequestType(type);
    setRequestQuery(query);
    setRequestModalOpen(true);
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

  useEffect(() => {
    // Set first enabled service as default tab
    if (config) {
      const tabs = getEnabledTabs();
      if (tabs.length > 0) {
        setSelectedTab(tabs[0].key);
      }
    }
  }, [config]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Request Bar - Always visible at top */}
      <RequestBar onRequest={handleRequestSubmit} />

      {/* Request Modal */}
      <RequestModal 
        isOpen={requestModalOpen}
        type={requestType}
        query={requestQuery}
        onClose={() => setRequestModalOpen(false)}
      />

      {/* Dashboard Layout with Sidebar - Similar to PostDeploymentWizard */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#f5f5f5' }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: '300px',
          background: 'white',
          borderRight: '1px solid #dee2e6',
          padding: '20px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#333' }}>PlexArr Dashboard</h2>
          
          {/* Stack Status Info */}
          {stackStatus && (
            <div style={{
              padding: '12px',
              background: '#f9f9f9',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Stack Status</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: getStatusColor(stackStatus.status)
              }}>
                {stackStatus.status}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {stackStatus.containers.length} container{stackStatus.containers.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Service Tabs */}
            {getEnabledTabs().map((tab) => (
              <div
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedTab === tab.key ? '#e3f2fd' : '#f9f9f9',
                  borderLeft: selectedTab === tab.key ? '4px solid #2196F3' : '4px solid transparent',
                  paddingLeft: selectedTab === tab.key ? '8px' : '12px'
                }}
                onMouseEnter={(e) => {
                  if (selectedTab !== tab.key) {
                    e.currentTarget.style.background = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTab !== tab.key) {
                    e.currentTarget.style.background = '#f9f9f9';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: selectedTab === tab.key ? '#2196F3' : '#e0e0e0',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {tab.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>{tab.label}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Service Dashboard</div>
                </div>
              </div>
            ))}

            {/* Docker Control Tab */}
            <div
              onClick={() => setSelectedTab('docker')}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedTab === 'docker' ? '#e3f2fd' : '#f9f9f9',
                borderLeft: selectedTab === 'docker' ? '4px solid #2196F3' : '4px solid transparent',
                paddingLeft: selectedTab === 'docker' ? '8px' : '12px'
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== 'docker') {
                  e.currentTarget.style.background = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== 'docker') {
                  e.currentTarget.style.background = '#f9f9f9';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: selectedTab === 'docker' ? '#2196F3' : '#e0e0e0',
                fontSize: '16px',
                flexShrink: 0
              }}>
                🐳
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Docker Control</div>
                <div style={{ fontSize: '12px', color: '#999' }}>Manage Containers</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
            <button 
              onClick={refresh}
              style={{
                width: '100%',
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
            >
              🔄 Refresh Status
            </button>
            <button 
              onClick={() => navigate('/wizard')}
              style={{
                width: '100%',
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            >
              ← Back to Wizard
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Content Header */}
          <div style={{
            padding: '30px 40px',
            background: 'white',
            borderBottom: '1px solid #dee2e6',
            flexShrink: 0
          }}>
            <h1 style={{ fontSize: '28px', margin: '0 0 10px 0', color: '#333' }}>
              {selectedTab === 'docker' ? '🐳 Docker Control' : (() => {
                const activeTab = getEnabledTabs().find(t => t.key === selectedTab);
                return activeTab ? `${activeTab.icon} ${activeTab.label}` : 'Dashboard';
              })()}
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              {selectedTab === 'docker' 
                ? 'Manage your Docker containers, view logs, and control the stack'
                : 'Access and manage your service'
              }
            </p>
          </div>

          {/* Content Body */}
          <div style={{ flex: 1, overflow: 'auto', padding: '30px 40px' }}>
            {selectedTab === 'docker' ? (
              // Docker Control Content
              <>
                {/* Stack Controls */}
                <div style={{ 
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Stack Controls</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => controlStack('start')}
                      disabled={!!controlAction}
                      style={{
                        padding: '10px 20px',
                        cursor: controlAction ? 'not-allowed' : 'pointer',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: controlAction ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#218838')}
                      onMouseLeave={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#28a745')}
                    >
                      ▶️ Start All
                    </button>
                    <button 
                      onClick={() => controlStack('stop')}
                      disabled={!!controlAction}
                      style={{
                        padding: '10px 20px',
                        cursor: controlAction ? 'not-allowed' : 'pointer',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: controlAction ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#c82333')}
                      onMouseLeave={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#dc3545')}
                    >
                      ⏸️ Stop All
                    </button>
                    <button 
                      onClick={() => controlStack('restart')}
                      disabled={!!controlAction}
                      style={{
                        padding: '10px 20px',
                        cursor: controlAction ? 'not-allowed' : 'pointer',
                        backgroundColor: '#ffc107',
                        color: 'black',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: controlAction ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#e0a800')}
                      onMouseLeave={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#ffc107')}
                    >
                      🔄 Restart All
                    </button>
                    <button 
                      onClick={() => controlStack('pull')}
                      disabled={!!controlAction}
                      style={{
                        padding: '10px 20px',
                        cursor: controlAction ? 'not-allowed' : 'pointer',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: controlAction ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#138496')}
                      onMouseLeave={(e) => !controlAction && (e.currentTarget.style.backgroundColor = '#17a2b8')}
                    >
                      ⬇️ Pull Updates
                    </button>
                  </div>
                  {controlAction && (
                    <p style={{ marginTop: '15px', marginBottom: 0, color: '#666', fontSize: '14px' }}>
                      ⏳ Executing: <strong>{controlAction}</strong>...
                    </p>
                  )}
                </div>

                {/* Containers Table */}
                <div style={{ 
                  marginBottom: '30px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Containers</h3>
                  </div>
                  {stackStatus && stackStatus.containers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>Service</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>Container</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>State</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>Status</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>Ports</th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '13px', color: '#666' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stackStatus.containers.map((c, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                              <td style={{ padding: '12px 20px', fontSize: '14px' }}>{c.service}</td>
                              <td style={{ padding: '12px 20px', fontSize: '12px', color: '#666' }}>{c.name}</td>
                              <td style={{ 
                                padding: '12px 20px',
                                color: getStatusColor(c.state),
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}>
                                {c.state}
                                {c.health && ` (${c.health})`}
                              </td>
                              <td style={{ padding: '12px 20px', fontSize: '12px', color: '#666' }}>{c.status}</td>
                              <td style={{ padding: '12px 20px', fontSize: '12px', color: '#666' }}>
                                {c.ports.length > 0 ? c.ports.join(', ') : '-'}
                              </td>
                              <td style={{ padding: '12px 20px' }}>
                                <button 
                                  onClick={() => viewLogs(c.service)}
                                  style={{
                                    padding: '6px 14px',
                                    cursor: 'pointer',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                                >
                                  📋 View Logs
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                      No containers running. Deploy your stack first.
                    </div>
                  )}
                </div>

                {/* Logs Viewer */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  marginBottom: '30px'
                }}>
                  <div style={{ 
                    padding: '20px',
                    borderBottom: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>
                      Container Logs {selectedService && selectedService !== 'all' && `- ${selectedService}`}
                      {selectedService === 'all' && ' - All Services'}
                    </h3>
                    <button 
                      onClick={viewAllLogs}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                    >
                      View All Logs
                    </button>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {loadingLogs ? (
                      <p style={{ color: '#666', margin: 0 }}>Loading logs...</p>
                    ) : logs ? (
                      <pre style={{ 
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '20px',
                        borderRadius: '6px',
                        overflow: 'auto',
                        maxHeight: '500px',
                        fontSize: '12px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        margin: 0,
                        lineHeight: 1.5
                      }}>
                        {logs}
                      </pre>
                    ) : (
                      <p style={{ color: '#666', margin: 0 }}>
                        Select a container from the table above to view its logs, or click "View All Logs" to see combined output.
                      </p>
                    )}
                  </div>
                </div>

                {/* Service Coordination */}
                <div style={{ 
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '18px' }}>Service Coordination</h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    Connect services by sharing API keys between Radarr, Sonarr, Prowlarr, and Overseerr.
                  </p>
                  <button 
                    onClick={runCoordination} 
                    disabled={coordStatus?.running}
                    style={{
                      padding: '10px 20px',
                      cursor: coordStatus?.running ? 'not-allowed' : 'pointer',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: coordStatus?.running ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => !coordStatus?.running && (e.currentTarget.style.backgroundColor = '#0056b3')}
                    onMouseLeave={(e) => !coordStatus?.running && (e.currentTarget.style.backgroundColor = '#007bff')}
                  >
                    {coordStatus?.running ? '⏳ Running Coordination...' : '🔗 Run Coordination'}
                  </button>
                  {coordStatus && !coordStatus.running && (
                    <pre style={{ 
                      marginTop: '15px',
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      border: '1px solid #dee2e6',
                      maxHeight: '300px',
                      overflow: 'auto',
                      marginBottom: 0
                    }}>
                      {JSON.stringify(coordStatus, null, 2)}
                    </pre>
                  )}
                </div>
              </>
            ) : (
              // Service IFrame Content
              (() => {
                const activeTab = getEnabledTabs().find(t => t.key === selectedTab);
                return activeTab ? (
                  <div style={{ 
                    height: '100%',
                    minHeight: '600px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                  }}>
                    <ServiceIframe
                      serviceName={activeTab.key}
                      label={activeTab.label}
                      port={activeTab.port}
                      basePath={activeTab.basePath}
                      icon={activeTab.icon}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    Select a service from the sidebar to get started
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
