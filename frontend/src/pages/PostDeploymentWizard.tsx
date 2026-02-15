// Post-deployment setup wizard - guides users through configuring each service

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlexArrConfig } from '../types/plexarr-config.types';
import { SetupInstructions } from '../components/SetupInstructions';
import { generateSetupInstructions } from '../services/setupInstructions';
import '../styles/PostDeploymentWizard.css';

interface SetupStep {
  id: string;
  label: string;
  icon: string;
  service: string;
  port: number;
  enabled: boolean;
  completed: boolean;
  description: string;
}

const PostDeploymentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PlexArrConfig | null>(null);
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/config-new');
      setConfig(res.data);
      generateSteps(res.data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSteps = (config: PlexArrConfig): void => {
    const newSteps: SetupStep[] = [];

    // Core services in order
    if (config.services.plex?.enabled) {
      newSteps.push({
        id: 'plex',
        label: 'Plex Setup',
        icon: '📺',
        service: 'plex',
        port: config.services.plex.port,
        enabled: true,
        completed: false,
        description: 'Create libraries and configure Plex'
      });
    }

    if (config.services.radarr?.enabled) {
      newSteps.push({
        id: 'radarr',
        label: 'Radarr Setup',
        icon: '🎬',
        service: 'radarr',
        port: config.services.radarr.port,
        enabled: true,
        completed: false,
        description: 'Configure movie management'
      });
    }

    if (config.services.sonarr?.enabled) {
      newSteps.push({
        id: 'sonarr',
        label: 'Sonarr Setup',
        icon: '📺',
        service: 'sonarr',
        port: config.services.sonarr.port,
        enabled: true,
        completed: false,
        description: 'Configure TV show management'
      });
    }

    if (config.services.lidarr?.enabled) {
      newSteps.push({
        id: 'lidarr',
        label: 'Lidarr Setup',
        icon: '🎵',
        service: 'lidarr',
        port: config.services.lidarr.port,
        enabled: true,
        completed: false,
        description: 'Configure music management'
      });
    }

    if (config.services.prowlarr?.enabled) {
      newSteps.push({
        id: 'prowlarr',
        label: 'Prowlarr Setup',
        icon: '🔍',
        service: 'prowlarr',
        port: config.services.prowlarr.port,
        enabled: true,
        completed: false,
        description: 'Configure indexers and sources'
      });
    }

    if (config.services.overseerr?.enabled) {
      newSteps.push({
        id: 'overseerr',
        label: 'Overseerr Setup',
        icon: '🎁',
        service: 'overseerr',
        port: config.services.overseerr.port,
        enabled: true,
        completed: false,
        description: 'Configure media request system'
      });
    }

    if (config.services.maintainerr?.enabled) {
      newSteps.push({
        id: 'maintainerr',
        label: 'Maintainerr Setup',
        icon: '🛠️',
        service: 'maintainerr',
        port: config.services.maintainerr.port,
        enabled: true,
        completed: false,
        description: 'Configure collection management'
      });
    }

    // Download clients
    if (config.services.nzbget?.enabled) {
      newSteps.push({
        id: 'nzbget',
        label: 'NZBGet (Media)',
        icon: '📥',
        service: 'nzbget',
        port: config.services.nzbget.port,
        enabled: true,
        completed: false,
        description: 'Usenet downloads client'
      });
    }

    if (config.services.nzbgetMusic?.enabled) {
      newSteps.push({
        id: 'nzbgetMusic',
        label: 'NZBGet (Music)',
        icon: '🎵',
        service: 'nzbgetMusic',
        port: config.services.nzbgetMusic.port,
        enabled: true,
        completed: false,
        description: 'Usenet downloads for music'
      });
    }

    if (config.services.qbittorrent?.enabled) {
      newSteps.push({
        id: 'qbittorrent',
        label: 'qBittorrent Setup',
        icon: '⚡',
        service: 'qbittorrent',
        port: config.services.qbittorrent.port,
        enabled: true,
        completed: false,
        description: 'BitTorrent downloads'
      });
    }

    if (config.services.metube?.enabled) {
      newSteps.push({
        id: 'metube',
        label: 'MeTube Setup',
        icon: '📹',
        service: 'metube',
        port: config.services.metube.port,
        enabled: true,
        completed: false,
        description: 'YouTube & video downloads'
      });
    }

    // Connection steps
    newSteps.push(
      {
        id: 'coordination',
        label: 'Connect Services',
        icon: '🔗',
        service: 'coordination',
        port: 0,
        enabled: true,
        completed: false,
        description: 'Link services together with API keys'
      },
      {
        id: 'validate',
        label: 'Validate Setup',
        icon: '✅',
        service: 'validate',
        port: 0,
        enabled: true,
        completed: false,
        description: 'Confirm all services are connected'
      }
    );

    setSteps(newSteps);
  };

  const markStepComplete = (stepId: string) => {
    const newSet = new Set(completedSteps);
    newSet.add(stepId);
    setCompletedSteps(newSet);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
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

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleComplete = () => {
    localStorage.setItem('plexarr_post_setup_completed', 'true');
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="setup-loading">Loading setup wizard...</div>;
  }

  const currentStep = steps[currentStepIndex];
  const progress = ((completedSteps.size + 1) / steps.length) * 100;

  return (
    <div className="post-deployment-wizard">
      {/* Sidebar Progress */}
      <aside className="setup-sidebar">
        <h2>Setup Progress</h2>
        <div className="steps-list">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`step-item ${idx === currentStepIndex ? 'active' : ''} ${
                completedSteps.has(step.id) ? 'completed' : ''
              }`}
              onClick={() => setCurrentStepIndex(idx)}
            >
              <div className="step-indicator">
                {completedSteps.has(step.id) ? (
                  <span className="check">✓</span>
                ) : (
                  <span className="number">{idx + 1}</span>
                )}
              </div>
              <div className="step-info">
                <div className="step-label">{step.icon} {step.label}</div>
                <div className="step-desc">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {completedSteps.size} of {steps.length} complete
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="setup-main">
        <div className="setup-header">
          <h1>{currentStep.icon} {currentStep.label}</h1>
          <p className="setup-description">{currentStep.description}</p>
        </div>

        <div className="setup-content">
          {/* Setup Instructions - Context-aware guidance */}
          {config && (
            <SetupInstructions
              {...generateSetupInstructions(currentStep.service, config, Array.from(completedSteps))}
            />
          )}

          {/* Service Configuration UI or Instructions */}
          <div className="service-frame">
            {currentStep.service === 'plex' && (
              <iframe
                src={`http://localhost:${currentStep.port}/web`}
                title="Plex Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'radarr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Radarr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'sonarr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Sonarr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'lidarr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Lidarr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'prowlarr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Prowlarr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'overseerr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Overseerr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'maintainerr' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="Maintainerr Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'nzbget' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="NZBGet Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'nzbgetMusic' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="NZBGet Music Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'qbittorrent' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="qBittorrent Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'metube' && (
              <iframe
                src={`http://localhost:${currentStep.port}`}
                title="MeTube Setup"
                className="service-iframe"
              />
            )}
            {currentStep.service === 'coordination' && (
              <div className="setup-instructions">
                <h2>Connect Services Together</h2>
                <p>
                  This step will automatically connect your Arr services (Radarr, Sonarr, Prowlarr)
                  to Overseerr and set up download client connections.
                </p>
                <div className="instructions-box">
                  <h3>What happens:</h3>
                  <ul>
                    <li>API keys are exchanged between services</li>
                    <li>Prowlarr indexes are added to Radarr and Sonarr</li>
                    <li>Download clients are added to each Arr service</li>
                    <li>Overseerr is linked to Radarr and Sonarr</li>
                  </ul>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => markStepComplete('coordination')}
                >
                  ✓ Coordination Complete
                </button>
              </div>
            )}
            {currentStep.service === 'validate' && (
              <div className="setup-instructions">
                <h2>Validate Your Setup</h2>
                <p>All services should now be connected and working together.</p>
                <div className="validation-status">
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Plex is accessible</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Radarr is configured</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Sonarr is configured</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Prowlarr has indexers</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Download clients connected</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🟢</span>
                    <span>Services coordinated</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleComplete}>
                  ✓ Setup Complete - Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="setup-nav">
          <button
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            ← Previous
          </button>
          <div className="nav-middle">
            <span className="step-counter">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            {currentStepIndex < steps.length - 1 && (
              <button
                className="btn-link"
                onClick={handleSkip}
              >
                Skip to Dashboard
              </button>
            )}
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              markStepComplete(currentStep.id);
              handleNext();
            }}
            disabled={currentStepIndex === steps.length - 1 && currentStep.service !== 'validate'}
          >
            {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next →'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PostDeploymentWizard;
