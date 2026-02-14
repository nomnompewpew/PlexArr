import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ConfigData, WizardStepInfo } from '../types/config.types';
import WizardStepComponent from '../components/WizardStepComponent';
import './WizardPage.css';

const WizardPage: React.FC = () => {
  const [steps, setSteps] = useState<WizardStepInfo[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [config, setConfig] = useState<Partial<ConfigData>>({});
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadWizardSteps();
    loadDefaults();
  }, []);

  const loadWizardSteps = async () => {
    try {
      const response = await api.get('/wizard/steps');
      setSteps(response.data.steps);
    } catch (error) {
      console.error('Error loading wizard steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaults = async () => {
    try {
      const response = await api.get('/wizard/defaults');
      setConfig(response.data.defaults);
    } catch (error) {
      console.error('Error loading defaults:', error);
    }
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

  const handleConfigChange = (updates: Partial<ConfigData>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      // Save configuration
      await api.post('/config', config);

      // Generate docker-compose
      const generateResponse = await api.post('/deploy/generate', config);
      
      console.log('Docker Compose Generated:', generateResponse.data);

      // Show deployment instructions
      alert('Configuration saved! Docker compose file has been generated. Check the console for deployment instructions.');
      
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Failed to deploy. Check console for details.');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return <div className="wizard-loading">Loading wizard...</div>;
  }

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="wizard-page">
      <div className="wizard-header">
        <h1>🎬 PlexArr Setup Wizard</h1>
        <p>Unified Plex Media Server Configuration</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="step-indicator">
          Step {currentStepIndex + 1} of {steps.length}: {currentStep?.title}
        </div>
      </div>

      <div className="wizard-content">
        {currentStep && (
          <WizardStepComponent
            step={currentStep}
            config={config}
            onConfigChange={handleConfigChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onDeploy={handleDeploy}
            isFirst={currentStepIndex === 0}
            isLast={currentStepIndex === steps.length - 1}
            deploying={deploying}
          />
        )}
      </div>

      <div className="wizard-footer">
        <div className="step-dots">
          {steps.map((step, index) => (
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
