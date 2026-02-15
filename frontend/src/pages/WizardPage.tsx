import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlexArrConfig } from '../types/plexarr-config.types';
import { StorageStep } from '../components/steps/StorageStep';
import { ServicesStep } from '../components/steps/ServicesStep';
import { ReviewStep } from '../components/steps/ReviewStep';
import { ContextLabel } from '../components/ContextLabel';
import { ThreePaneLayout } from '../components/ThreePaneLayout';
import { CalloutBox } from '../components/CalloutBox';
import './WizardPage.css';

type StepId = 'welcome' | 'system' | 'storage' | 'services' | 'review';

const STEPS: { id: StepId; title: string; description: string }[] = [
  { id: 'welcome', title: 'Welcome', description: 'Overview of what PlexArr will configure.' },
  { id: 'system', title: 'System', description: 'Timezone and permissions.' },
  { id: 'storage', title: 'Storage Paths', description: 'Media, downloads, and config paths.' },
  { id: 'services', title: 'Services', description: 'Enable services and set ports.' },
  { id: 'review', title: 'Review & Deploy', description: 'Review config and deploy.' },
];

const createFallbackConfig = (): PlexArrConfig => ({
  version: 1,
  system: { timezone: 'UTC', puid: 1000, pgid: 1000, projectFolder: '/opt/plexarr' },
  network: {},
  storage: {
    mediaRoot: '/data/media',
    downloads: '/data/downloads',
    config: '/opt/plexarr/config',
  },
  services: {
    plex: { enabled: true, port: 32400 },
    radarr: { enabled: true, port: 7878 },
    sonarr: { enabled: true, port: 8989 },
    lidarr: { enabled: false, port: 8686 },
    prowlarr: { enabled: true, port: 9696 },
    overseerr: { enabled: true, port: 5055 },
    maintainerr: { enabled: true, port: 6246 },
    nzbget: { enabled: true, port: 6789 },
    nginxProxyManager: { enabled: false, port: 81 },
    wireguard: { enabled: false, port: 51820 },
  },
});

const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [config, setConfig] = useState<PlexArrConfig>(createFallbackConfig());
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    loadConfig();
    loadTimezones();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/config-new');
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
      setConfig(createFallbackConfig());
    } finally {
      setLoading(false);
    }
  };

  const loadTimezones = async () => {
    try {
      const response = await api.get('/wizard/timezones');
      setTimezones(response.data.timezones || []);
    } catch (error) {
      console.warn('Error loading timezones:', error);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    try {
      await api.put('/config-new', config);
      await api.post('/deploy-new/execute', config);
      localStorage.setItem('plexarr_deployment_completed', 'true');
      navigate('/post-deployment-setup');
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeployError(error?.response?.data?.message || error?.message || 'Failed to deploy.');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return <div className="wizard-loading">Loading wizard...</div>;
  }

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const renderWelcomeStep = () => (
    <div className="step-content">
      <h2 className="step-heading">Welcome to PlexArr! 🎉</h2>
      <p className="step-description">Set up your unified Plex media server in minutes</p>
      
      <CalloutBox type="blue" icon="📦" title="What is PlexArr?">
        <p>
          PlexArr unifies your Plex media server setup by automatically configuring
          and connecting all your Arr applications with download clients.
        </p>
      </CalloutBox>

      <CalloutBox type="green" icon="🚀" title="What will this wizard do?">
        <ul>
          <li>Guide you through storage, services, and ports</li>
          <li>Validate your configuration</li>
          <li>Generate and deploy docker-compose</li>
        </ul>
      </CalloutBox>
    </div>
  );

  const renderSystemStep = () => (
    <div className="step-content">
      <h2 className="step-heading">System Configuration</h2>
      <p className="step-description">
        Configure basic system settings used by all containers.
      </p>

      <CalloutBox type="orange" icon="⚠️" title="Important: Get Correct Values">
        <p>
          PUID and PGID must match your system user. Don't guess - run the commands shown below to get the correct values.
        </p>
      </CalloutBox>

      <div className="form-group">
        <label htmlFor="timezone">Timezone *</label>
        {timezones.length > 0 ? (
          <select
            id="timezone"
            value={config.system.timezone}
            onChange={(e) => setConfig({ ...config, system: { ...config.system, timezone: e.target.value } })}
            className="form-control"
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        ) : (
          <input
            id="timezone"
            type="text"
            value={config.system.timezone}
            onChange={(e) => setConfig({ ...config, system: { ...config.system, timezone: e.target.value } })}
            className="form-control"
            placeholder="America/New_York"
          />
        )}
        <small>Select your local timezone for proper scheduling</small>
        <ContextLabel type="user-config" text="You choose this based on your location — it affects when scheduled tasks run" />
      </div>

      <div className="form-group">
        <label htmlFor="puid">User ID (PUID) *</label>
        <input
          id="puid"
          type="number"
          value={config.system.puid}
          onChange={(e) => setConfig({ ...config, system: { ...config.system, puid: parseInt(e.target.value, 10) } })}
          className="form-control"
        />
        <small>Run <code>id -u</code> in terminal to find yours.</small>
        <ContextLabel type="system-default" text="System value unique to your user account — required for proper file permissions but don't guess" />
      </div>

      <div className="form-group">
        <label htmlFor="pgid">Group ID (PGID) *</label>
        <input
          id="pgid"
          type="number"
          value={config.system.pgid}
          onChange={(e) => setConfig({ ...config, system: { ...config.system, pgid: parseInt(e.target.value, 10) } })}
          className="form-control"
        />
        <small>Run <code>id -g</code> in terminal to find yours.</small>
        <ContextLabel type="system-default" text="System value unique to your group — required for file permissions but don't guess" />
      </div>

      <div className="form-group">
        <label htmlFor="projectFolder">Project Folder (on Host) *</label>
        <input
          id="projectFolder"
          type="text"
          value={config.system.projectFolder}
          onChange={(e) => setConfig({ ...config, system: { ...config.system, projectFolder: e.target.value } })}
          className="form-control"
          placeholder="/opt/plexarr"
        />
        <small>Where to store your docker-compose.yml and stack data on the host. Default: <code>/opt/plexarr</code></small>
        <ContextLabel type="user-config" text="You choose where on your drive PlexArr stores its configuration — use default unless you have a specific reason" />
      </div>

      <div className="form-group">
        <label htmlFor="publicIp">Public IP Address (optional)</label>
        <input
          id="publicIp"
          type="text"
          value={config.network.publicIp || ''}
          onChange={(e) => setConfig({ ...config, network: { ...config.network, publicIp: e.target.value } })}
          className="form-control"
          placeholder="123.456.789.0"
        />
        <ContextLabel type="optional" text="Only needed if you want to access services from outside your home network" />
      </div>

      <div className="form-group">
        <label htmlFor="publicDomain">Public Domain (optional)</label>
        <input
          id="publicDomain"
          type="text"
          value={config.network.publicDomain || ''}
          onChange={(e) => setConfig({ ...config, network: { ...config.network, publicDomain: e.target.value } })}
          className="form-control"
          placeholder="myserver.example.com"
        />
        <ContextLabel type="optional" text="Only needed if you have a domain name (e.g., from DynDNS) for remote access" />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'system':
        return renderSystemStep();
      case 'storage':
        return (
          <StorageStep
            paths={config.storage}
            onChange={(paths) => setConfig({ ...config, storage: paths })}
          />
        );
      case 'services':
        return (
          <ServicesStep
            services={config.services as Record<string, { enabled: boolean; port: number; apiKey?: string }>}
            onChange={(services) => setConfig({ ...config, services: services as any })}
          />
        );
      case 'review':
        return <ReviewStep config={config} onDeploy={handleDeploy} />;
      default:
        return null;
    }
  };

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Sidebar content with progress tracking
  const renderSidebar = () => (
    <>
      <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#333' }}>Setup Progress</h2>
      
      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' }}>
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`step-item ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}
            onClick={() => setCurrentStepIndex(idx)}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: idx === currentStepIndex ? '#e3f2fd' : idx < currentStepIndex ? '#e8f5e9' : '#f9f9f9',
              borderLeft: idx === currentStepIndex ? '4px solid #2196F3' : '4px solid transparent',
              paddingLeft: idx === currentStepIndex ? '8px' : '12px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: idx < currentStepIndex ? '#4caf50' : idx === currentStepIndex ? '#2196F3' : '#e0e0e0',
              color: idx <= currentStepIndex ? 'white' : '#666',
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {idx < currentStepIndex ? '✓' : idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>{step.title}</div>
              <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
        <div style={{
          width: '100%',
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '10px'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4caf50, #45a049)',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#666',
          margin: 0
        }}>
          Step {currentStepIndex + 1} of {STEPS.length}
        </p>
      </div>
    </>
  );

  // Footer with navigation buttons
  const renderFooter = () => (
    <>
      {currentStepIndex > 0 && (
        <button onClick={handlePrevious} className="btn btn-secondary">
          ← Previous
        </button>
      )}
      <div style={{ flex: 1 }} />
      {deployError && (
        <div style={{ color: '#dc3545', fontSize: '13px', maxWidth: '300px' }}>
          <strong>Error:</strong> {deployError}
        </div>
      )}
      {currentStepIndex < STEPS.length - 1 && (
        <button onClick={handleNext} className="btn btn-primary">
          Next →
        </button>
      )}
      {currentStepIndex === STEPS.length - 1 && (
        <button onClick={handleDeploy} className="btn btn-success" disabled={deploying}>
          {deploying ? 'Deploying...' : '🚀 Deploy Now'}
        </button>
      )}
    </>
  );

  return (
    <ThreePaneLayout
      sidebar={renderSidebar()}
      footer={renderFooter()}
    >
      {/* Page Header */}
      <div style={{
        background: 'white',
        borderRadius: '12px 12px 0 0',
        padding: '30px',
        marginLeft: '-40px',
        marginRight: '-40px',
        marginTop: '-30px',
        marginBottom: '30px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 10px 0', color: '#333' }}>
          🎬 {currentStep.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {currentStep.description}
        </p>
      </div>

      {/* Main Content Card */}
      <div className="three-pane-card">
        {renderStepContent()}
      </div>
    </ThreePaneLayout>
  );
};

export default WizardPage;
