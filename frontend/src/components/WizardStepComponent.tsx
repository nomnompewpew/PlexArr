import React, { useState, useEffect } from 'react';
import { WizardStepInfo, ConfigData, WizardStep } from '../types/config.types';
import { api } from '../services/api';
import './WizardStepComponent.css';

interface Props {
  step: WizardStepInfo;
  config: Partial<ConfigData>;
  onConfigChange: (updates: Partial<ConfigData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onDeploy: () => void;
  isFirst: boolean;
  isLast: boolean;
  deploying: boolean;
}

const WizardStepComponent: React.FC<Props> = ({
  step,
  config,
  onConfigChange,
  onNext,
  onPrevious,
  onDeploy,
  isFirst,
  isLast,
  deploying
}) => {
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    if (step.id === WizardStep.SYSTEM) {
      loadTimezones();
    }
  }, [step.id]);

  const loadTimezones = async () => {
    try {
      const response = await api.get('/wizard/timezones');
      setTimezones(response.data.timezones);
    } catch (error) {
      console.error('Error loading timezones:', error);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    const updates = {
      ...config,
      [section]: {
        ...(config as any)[section],
        [field]: value
      }
    };
    onConfigChange(updates);
  };

  const handleServiceToggle = (service: string, enabled: boolean) => {
    const updates = {
      ...config,
      services: {
        ...config.services,
        [service]: {
          ...(config.services as any)?.[service],
          enabled
        }
      }
    };
    onConfigChange(updates as any);
  };

  const renderWelcomeStep = () => (
    <div className="step-content">
      <div className="welcome-hero">
        <h2>Welcome to PlexArr! 🎉</h2>
        <p className="subtitle">
          Set up your unified Plex media server in minutes
        </p>
      </div>

      <div className="info-boxes">
        <div className="info-box">
          <h3>📦 What is PlexArr?</h3>
          <p>
            PlexArr unifies your Plex media server setup by automatically configuring
            and connecting all your "Arr" applications (Radarr, Sonarr, Lidarr, Prowlarr)
            with download clients and request managers.
          </p>
        </div>

        <div className="info-box">
          <h3>🚀 What will this wizard do?</h3>
          <ul>
            <li>Guide you through configuration of all services</li>
            <li>Set up automatic API key coordination</li>
            <li>Generate a ready-to-use docker-compose file</li>
            <li>Configure network settings for container communication</li>
            <li>Help with router/firewall setup for external access</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>⏱️ How long will it take?</h3>
          <p>
            About 10-15 minutes. You'll need to know your file system paths
            and preferences for each service. Don't worry - we'll guide you through it!
          </p>
        </div>
      </div>

      <div className="warning-box">
        <strong>⚠️ Before you start:</strong>
        <ul>
          <li>Have Docker and Docker Compose installed</li>
          <li>Know where you want to store your media files</li>
          <li>Have your router admin access ready (for port forwarding)</li>
          <li>Optional: Have a Plex claim token ready (get from <a href="https://www.plex.tv/claim" target="_blank" rel="noopener noreferrer">plex.tv/claim</a>)</li>
        </ul>
      </div>
    </div>
  );

  const renderSystemStep = () => (
    <div className="step-content">
      <h2>System Configuration</h2>
      <p className="help-text">
        Configure basic system settings that will be used across all containers.
      </p>

      <div className="form-group">
        <label htmlFor="timezone">Timezone *</label>
        <select
          id="timezone"
          value={config.system?.timezone || 'UTC'}
          onChange={(e) => handleInputChange('system', 'timezone', e.target.value)}
          className="form-control"
        >
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <small>Select your local timezone for proper scheduling and timestamps</small>
      </div>

      <div className="form-group">
        <label htmlFor="puid">User ID (PUID) *</label>
        <input
          id="puid"
          type="number"
          value={config.system?.puid || 1000}
          onChange={(e) => handleInputChange('system', 'puid', parseInt(e.target.value))}
          className="form-control"
        />
        <small>Linux user ID for file permissions. Run <code>id -u</code> in terminal to find yours.</small>
      </div>

      <div className="form-group">
        <label htmlFor="pgid">Group ID (PGID) *</label>
        <input
          id="pgid"
          type="number"
          value={config.system?.pgid || 1000}
          onChange={(e) => handleInputChange('system', 'pgid', parseInt(e.target.value))}
          className="form-control"
        />
        <small>Linux group ID for file permissions. Run <code>id -g</code> in terminal to find yours.</small>
      </div>
    </div>
  );

  const renderNetworkStep = () => (
    <div className="step-content">
      <h2>Network Configuration</h2>
      <p className="help-text">
        Configure network settings for external access (optional).
      </p>

      <div className="info-box">
        <h3>📡 Network Setup</h3>
        <p>
          All containers will communicate on shared Docker networks (<code>adguard_default</code> and <code>stacks_default</code>).
          This allows automatic service discovery using container names.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="publicIp">Public IP Address (optional)</label>
        <input
          id="publicIp"
          type="text"
          value={config.network?.publicIp || ''}
          onChange={(e) => handleInputChange('network', 'publicIp', e.target.value)}
          className="form-control"
          placeholder="123.456.789.0"
        />
        <small>Your public IP for external access. Find it at <a href="https://whatismyip.com" target="_blank" rel="noopener noreferrer">whatismyip.com</a></small>
      </div>

      <div className="form-group">
        <label htmlFor="publicDomain">Public Domain (optional)</label>
        <input
          id="publicDomain"
          type="text"
          value={config.network?.publicDomain || ''}
          onChange={(e) => handleInputChange('network', 'publicDomain', e.target.value)}
          className="form-control"
          placeholder="myserver.example.com"
        />
        <small>If you have a domain name pointing to your server</small>
      </div>

      <div className="warning-box">
        <h4>🔧 Port Forwarding Required</h4>
        <p>
          To access your services externally, you'll need to configure port forwarding on your router:
        </p>
        <ul>
          <li>Login to your router's admin panel (usually 192.168.1.1 or 192.168.0.1)</li>
          <li>Find "Port Forwarding" or "Virtual Servers" section</li>
          <li>Forward these ports to your server's local IP:</li>
        </ul>
        <table className="port-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Port</th>
              <th>Protocol</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Plex</td><td>32400</td><td>TCP</td></tr>
            <tr><td>HTTP (Nginx)</td><td>80</td><td>TCP</td></tr>
            <tr><td>HTTPS (Nginx)</td><td>443</td><td>TCP</td></tr>
            <tr><td>WireGuard (if enabled)</td><td>51820</td><td>UDP</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServicesStep = () => (
    <div className="step-content">
      <h2>Select Services</h2>
      <p className="help-text">
        Choose which services you want to enable. You can always add more later.
      </p>

      <div className="services-grid">
        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-plex"
            checked={config.services?.plex?.enabled ?? true}
            onChange={(e) => handleServiceToggle('plex', e.target.checked)}
          />
          <label htmlFor="service-plex">
            <strong>Plex Media Server</strong>
            <p>Stream your media library</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-radarr"
            checked={config.services?.radarr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('radarr', e.target.checked)}
          />
          <label htmlFor="service-radarr">
            <strong>Radarr</strong>
            <p>Manage movies</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-sonarr"
            checked={config.services?.sonarr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('sonarr', e.target.checked)}
          />
          <label htmlFor="service-sonarr">
            <strong>Sonarr</strong>
            <p>Manage TV shows</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-prowlarr"
            checked={config.services?.prowlarr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('prowlarr', e.target.checked)}
          />
          <label htmlFor="service-prowlarr">
            <strong>Prowlarr</strong>
            <p>Indexer manager</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-lidarr"
            checked={config.services?.lidarr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('lidarr', e.target.checked)}
          />
          <label htmlFor="service-lidarr">
            <strong>Lidarr</strong>
            <p>Manage music</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-overseerr"
            checked={config.services?.overseerr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('overseerr', e.target.checked)}
          />
          <label htmlFor="service-overseerr">
            <strong>Overseerr</strong>
            <p>Media requests</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-maintainerr"
            checked={config.services?.maintainerr?.enabled ?? true}
            onChange={(e) => handleServiceToggle('maintainerr', e.target.checked)}
          />
          <label htmlFor="service-maintainerr">
            <strong>Maintainerr</strong>
            <p>Manage collections & categories</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-nzbget"
            checked={config.services?.nzbget?.enabled ?? true}
            onChange={(e) => handleServiceToggle('nzbget', e.target.checked)}
          />
          <label htmlFor="service-nzbget">
            <strong>NZBGet</strong>
            <p>Usenet downloader</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-nginx"
            checked={config.services?.nginxProxyManager?.enabled ?? false}
            onChange={(e) => handleServiceToggle('nginxProxyManager', e.target.checked)}
          />
          <label htmlFor="service-nginx">
            <strong>Nginx Proxy Manager</strong>
            <p>Reverse proxy with SSL (optional)</p>
          </label>
        </div>

        <div className="service-toggle">
          <input
            type="checkbox"
            id="service-wg"
            checked={config.services?.wgEasy?.enabled ?? false}
            onChange={(e) => handleServiceToggle('wgEasy', e.target.checked)}
          />
          <label htmlFor="service-wg">
            <strong>WireGuard VPN</strong>
            <p>Secure remote access (optional)</p>
          </label>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="step-content">
      <h2>Review Your Configuration</h2>
      <p className="help-text">
        Review your settings before deployment. You can go back to make changes.
      </p>

      <div className="review-section">
        <h3>System</h3>
        <ul>
          <li>Timezone: <code>{config.system?.timezone}</code></li>
          <li>User ID: <code>{config.system?.puid}</code></li>
          <li>Group ID: <code>{config.system?.pgid}</code></li>
        </ul>
      </div>

      <div className="review-section">
        <h3>Enabled Services</h3>
        <ul>
          {config.services?.plex?.enabled && <li>✓ Plex Media Server</li>}
          {config.services?.radarr?.enabled && <li>✓ Radarr (Movies)</li>}
          {config.services?.sonarr?.enabled && <li>✓ Sonarr (TV Shows)</li>}
          {config.services?.prowlarr?.enabled && <li>✓ Prowlarr (Indexers)</li>}
          {config.services?.lidarr?.enabled && <li>✓ Lidarr (Music)</li>}
          {config.services?.overseerr?.enabled && <li>✓ Overseerr (Requests)</li>}
          {config.services?.maintainerr?.enabled && <li>✓ Maintainerr (Collections)</li>}
          {config.services?.nzbget?.enabled && <li>✓ NZBGet (Downloads)</li>}
          {config.services?.nginxProxyManager?.enabled && <li>✓ Nginx Proxy Manager</li>}
          {config.services?.wgEasy?.enabled && <li>✓ WireGuard VPN</li>}
        </ul>
      </div>

      <div className="info-box">
        <h3>🎯 What happens next?</h3>
        <ol>
          <li>We'll generate your docker-compose.yml file</li>
          <li>You'll deploy it using <code>docker-compose up -d</code></li>
          <li>The system will automatically coordinate API keys between services</li>
          <li>All services will be connected and ready to use!</li>
        </ol>
      </div>
    </div>
  );

  const renderDeployStep = () => (
    <div className="step-content">
      <h2>🚀 Deploy Your Stack</h2>
      
      {deploying ? (
        <div className="deploying">
          <div className="spinner"></div>
          <p>Generating configuration...</p>
        </div>
      ) : (
        <>
          <div className="success-box">
            <h3>✅ Ready to Deploy!</h3>
            <p>Click the button below to generate your docker-compose file.</p>
          </div>

          <div className="deployment-steps">
            <h3>Deployment Instructions</h3>
            <ol>
              <li>
                <strong>Generate Configuration</strong>
                <p>Click "Deploy Now" to create your docker-compose.yml file</p>
              </li>
              <li>
                <strong>Start Services</strong>
                <p>Run this command in your terminal:</p>
                <pre><code>docker-compose up -d</code></pre>
              </li>
              <li>
                <strong>Wait for Services</strong>
                <p>Give services 2-3 minutes to start up</p>
              </li>
              <li>
                <strong>Automatic API Coordination</strong>
                <p>The system will automatically connect all services together</p>
              </li>
              <li>
                <strong>Access Your Services</strong>
                <p>Open the dashboard to access all your services</p>
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (step.id) {
      case WizardStep.WELCOME:
        return renderWelcomeStep();
      case WizardStep.SYSTEM:
        return renderSystemStep();
      case WizardStep.NETWORK:
        return renderNetworkStep();
      case WizardStep.SERVICES:
        return renderServicesStep();
      case WizardStep.REVIEW:
        return renderReviewStep();
      case WizardStep.DEPLOY:
        return renderDeployStep();
      default:
        return (
          <div className="step-content">
            <h2>{step.title}</h2>
            <p>{step.description}</p>
            <p className="help-text">This step is under construction. Click Next to continue.</p>
          </div>
        );
    }
  };

  return (
    <div className="wizard-step">
      {renderStepContent()}

      <div className="wizard-actions">
        {!isFirst && (
          <button onClick={onPrevious} className="btn btn-secondary">
            ← Previous
          </button>
        )}

        {!isLast && (
          <button onClick={onNext} className="btn btn-primary">
            Next →
          </button>
        )}

        {isLast && (
          <button 
            onClick={onDeploy} 
            className="btn btn-success"
            disabled={deploying}
          >
            {deploying ? 'Deploying...' : '🚀 Deploy Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WizardStepComponent;
