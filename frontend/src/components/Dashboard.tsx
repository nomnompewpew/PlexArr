// Dashboard component for stack health monitoring

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CoordinationStatus } from '../types/plexarr-config.types';

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

export const Dashboard: React.FC = () => {
  const [stackStatus, setStackStatus] = useState<StackStatus | null>(null);
  const [coordStatus, setCoordStatus] = useState<CoordinationStatus | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [controlAction, setControlAction] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await api.get('/deploy-new/status');
      setStackStatus(res.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
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
      {/* Stack Overview */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <div>
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

      {/* Stack Controls */}
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
