import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlexArrConfig } from '../types/plexarr-config.types';
import { StorageStep } from '../components/steps/StorageStep';
import { ServicesStep } from '../components/steps/ServicesStep';
import { ReviewStep } from '../components/steps/ReviewStep';
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
      localStorage.setItem('plexarr_setup_completed', 'true');
      navigate('/dashboard');
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
      <div className="welcome-hero">
        <h2>Welcome to PlexArr! 🎉</h2>
        <p className="subtitle">Set up your unified Plex media server in minutes</p>
      </div>
      <div className="info-boxes">
        <div className="info-box">
          <h3>📦 What is PlexArr?</h3>
          <p>
            PlexArr unifies your Plex media server setup by automatically configuring
            and connecting all your Arr applications with download clients.
          </p>
        </div>
        <div className="info-box">
          <h3>🚀 What will this wizard do?</h3>
          <ul>
            <li>Guide you through storage, services, and ports</li>
            <li>Validate your configuration</li>
            <li>Generate and deploy docker-compose</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSystemStep = () => (
    <div className="step-content">
      <h2>System Configuration</h2>
      <p className="help-text">
        Configure basic system settings used by all containers.
      </p>

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

  return (
    <div className="wizard-page">
      <div className="wizard-header">
        <h1>🎬 PlexArr Setup Wizard</h1>
        <p>Unified Plex Media Server Configuration</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="step-indicator">
          Step {currentStepIndex + 1} of {STEPS.length}: {currentStep.title}
        </div>
      </div>

      <div className="wizard-content">
        {renderStepContent()}
        {deployError && (
          <div className="warning-box">
            <strong>Deployment error:</strong> {deployError}
          </div>
        )}
      </div>

      <div className="wizard-actions">
        {currentStepIndex > 0 && (
          <button onClick={handlePrevious} className="btn btn-secondary">
            ← Previous
          </button>
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
      </div>

      <div className="wizard-footer">
        <div className="step-dots">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`dot ${index === currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
              title={step.title}
              onClick={() => setCurrentStepIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WizardPage;
