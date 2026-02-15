// Post-deployment wizard for API-based service configuration

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface ServiceStatus {
  name: string;
  label: string;
  running: boolean;
  configured: boolean;
  url: string;
  apiKey?: string;
}

interface ConfigurationStep {
  service: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  message?: string;
}

export const PostDeploymentWizard: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ConfigurationStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      const response = await api.get('/deploy/status');
      const statusData = response.data;
      
      const serviceList: ServiceStatus[] = [
        { name: 'plex', label: 'Plex', running: false, configured: false, url: 'http://localhost:32400' },
        { name: 'prowlarr', label: 'Prowlarr', running: false, configured: false, url: 'http://localhost:9696' },
        { name: 'radarr', label: 'Radarr', running: false, configured: false, url: 'http://localhost:7878' },
        { name: 'sonarr', label: 'Sonarr', running: false, configured: false, url: 'http://localhost:8989' },
        { name: 'lidarr', label: 'Lidarr', running: false, configured: false, url: 'http://localhost:8686' },
        { name: 'overseerr', label: 'Overseerr', running: false, configured: false, url: 'http://localhost:5055' },
      ];

      // Update status from backend
      if (statusData.containers) {
        statusData.containers.forEach((container: any) => {
          const service = serviceList.find(s => container.name.includes(s.name));
          if (service) {
            service.running = container.state === 'running';
          }
        });
      }

      setServices(serviceList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading service status:', error);
      setLoading(false);
    }
  };

  const startConfiguration = async () => {
    const configSteps: ConfigurationStep[] = [
      {
        service: 'prowlarr',
        title: 'Configure Prowlarr API Key',
        description: 'Extract API key from Prowlarr configuration',
        status: 'pending',
      },
      {
        service: 'radarr',
        title: 'Configure Radarr API Key',
        description: 'Extract API key from Radarr configuration',
        status: 'pending',
      },
      {
        service: 'sonarr',
        title: 'Configure Sonarr API Key',
        description: 'Extract API key from Sonarr configuration',
        status: 'pending',
      },
      {
        service: 'prowlarr-apps',
        title: 'Connect Prowlarr to Arr Apps',
        description: 'Register Radarr, Sonarr, and Lidarr in Prowlarr',
        status: 'pending',
      },
      {
        service: 'download-clients',
        title: 'Configure Download Clients',
        description: 'Add NZBGet to Radarr, Sonarr, and Lidarr',
        status: 'pending',
      },
      {
        service: 'overseerr',
        title: 'Initialize Overseerr',
        description: 'Connect Overseerr to Plex, Radarr, and Sonarr',
        status: 'pending',
      },
    ];

    setSteps(configSteps);
    await runConfigurationSteps(configSteps);
  };

  const runConfigurationSteps = async (configSteps: ConfigurationStep[]) => {
    for (let i = 0; i < configSteps.length; i++) {
      setCurrentStep(i);
      const step = configSteps[i];
      
      // Update step status to in-progress
      const updatedSteps = [...configSteps];
      updatedSteps[i] = { ...step, status: 'in-progress' };
      setSteps(updatedSteps);

      try {
        // Call appropriate API endpoint based on step
        let response;
        switch (step.service) {
          case 'prowlarr':
          case 'radarr':
          case 'sonarr':
            response = await api.post('/coordination/extract-api-keys');
            break;
          case 'prowlarr-apps':
            response = await api.post('/coordination/register-apps');
            break;
          case 'download-clients':
            response = await api.post('/coordination/configure-download-clients');
            break;
          case 'overseerr':
            response = await api.post('/coordination/configure-overseerr');
            break;
        }

        // Update step status to complete
        updatedSteps[i] = { 
          ...step, 
          status: 'complete',
          message: response?.data?.message || 'Configuration successful'
        };
        setSteps([...updatedSteps]);
      } catch (error: any) {
        // Update step status to error
        updatedSteps[i] = { 
          ...step, 
          status: 'error',
          message: error.response?.data?.message || error.message || 'Configuration failed'
        };
        setSteps([...updatedSteps]);
      }

      // Wait a bit before next step
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  if (loading) {
    return <div>Loading service status...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Post-Deployment Configuration</h1>
      <p>
        Your services are deployed! This wizard will help you configure them automatically
        using their APIs.
      </p>

      <div style={{ marginTop: 24 }}>
        <h2>Service Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {services.map((service) => (
            <div
              key={service.name}
              style={{
                padding: 16,
                border: '1px solid #333',
                borderRadius: 8,
                backgroundColor: service.running ? '#1a2a1a' : '#2a1a1a',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{service.label}</h3>
              <div style={{ fontSize: 12, color: service.running ? '#5f5' : '#f55' }}>
                {service.running ? '● Running' : '○ Not Running'}
              </div>
              {service.running && (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#4a9eff' }}
                >
                  Open UI →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {steps.length === 0 ? (
        <div style={{ marginTop: 32 }}>
          <button
            onClick={startConfiguration}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              backgroundColor: '#4a9eff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Start Automatic Configuration
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 32 }}>
          <h2>Configuration Progress</h2>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                padding: 16,
                marginBottom: 12,
                border: '1px solid #333',
                borderRadius: 8,
                backgroundColor: 
                  step.status === 'complete' ? '#1a2a1a' :
                  step.status === 'error' ? '#2a1a1a' :
                  step.status === 'in-progress' ? '#1a1a2a' : '#1a1a1a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>
                  {step.status === 'complete' && '✓'}
                  {step.status === 'error' && '✗'}
                  {step.status === 'in-progress' && '⟳'}
                  {step.status === 'pending' && '○'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{step.description}</div>
                  {step.message && (
                    <div style={{ 
                      marginTop: 8, 
                      fontSize: 12, 
                      color: step.status === 'error' ? '#f55' : '#5f5' 
                    }}>
                      {step.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {steps.every(s => s.status === 'complete' || s.status === 'error') && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '12px 24px',
                  fontSize: 16,
                  backgroundColor: '#4a9eff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
