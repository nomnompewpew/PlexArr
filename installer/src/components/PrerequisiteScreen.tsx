import { useState } from 'react';
import type { InstallationStateData, InstallationState, PrerequisiteCheck } from '../types/installer';
import ManualInstructionsModal from './ManualInstructionsModal';
import { MANUAL_INSTRUCTIONS } from '../utils/constants';

interface PrerequisiteScreenProps {
  state: InstallationStateData;
  onUpdateState: (updates: Partial<InstallationStateData>) => Promise<void>;
  onMoveToNextState: (state: InstallationState) => Promise<void>;
}

export default function PrerequisiteScreen({ 
  state, 
  onUpdateState,
  onMoveToNextState 
}: PrerequisiteScreenProps) {
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [selectedInstructionKey, setSelectedInstructionKey] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  const handleShowManualInstructions = (key: string) => {
    setSelectedInstructionKey(key);
    setShowManualInstructions(true);
  };

  const handleAutoFix = async (check: PrerequisiteCheck) => {
    setInstalling(true);
    try {
      // Implementation would go here to actually install the missing component
      console.log(`Auto-fixing: ${check.name}`);
      
      // For now, just show manual instructions
      if (check.name === 'WSL2') {
        handleShowManualInstructions('WINDOWS_WSL2');
      } else if (check.name === 'Docker Desktop' || check.name === 'Docker') {
        if (state.systemInfo.platform === 'windows') {
          handleShowManualInstructions('WINDOWS_DOCKER');
        } else if (state.systemInfo.platform === 'darwin') {
          handleShowManualInstructions('MACOS_DOCKER');
        } else if (state.systemInfo.platform === 'linux') {
          if (state.systemInfo.distro === 'ubuntu' || state.systemInfo.distro === 'debian') {
            handleShowManualInstructions('LINUX_DOCKER_UBUNTU');
          } else if (state.systemInfo.distro === 'fedora') {
            handleShowManualInstructions('LINUX_DOCKER_FEDORA');
          } else if (state.systemInfo.distro === 'arch') {
            handleShowManualInstructions('LINUX_DOCKER_ARCH');
          } else {
            handleShowManualInstructions('LINUX_DOCKER_UBUNTU');
          }
        }
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleContinue = async () => {
    const hasFailedRequired = state.checks.some(
      check => check.status === 'failed' && check.required
    );

    if (hasFailedRequired) {
      alert('Please fix all required prerequisites before continuing.');
      return;
    }

    await onMoveToNextState('installing_plexarr');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '○';
      default:
        return '?';
    }
  };

  const allChecksPassed = state.checks.every(
    check => !check.required || check.status === 'passed'
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Prerequisite Checks</h2>
      <p className="card-description">
        We're checking your system for required components. Some items may need to be installed automatically.
      </p>

      <div className="check-list">
        {state.checks.map((check, index) => (
          <div key={index} className="check-item">
            <div className="check-info">
              <div className="check-name">
                {getStatusIcon(check.status)} {check.name}
                {check.required && <span style={{ color: 'var(--error-color)', marginLeft: '0.5rem' }}>*</span>}
              </div>
              <div className="check-message">{check.message}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {check.status === 'failed' && check.canAutoFix && (
                <button
                  className="button button-primary"
                  onClick={() => handleAutoFix(check)}
                  disabled={installing}
                >
                  {installing ? 'Installing...' : 'Install'}
                </button>
              )}
              <span className={`status-badge status-${check.status}`}>
                {check.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {state.checks.length === 0 && (
        <div className="card">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Running prerequisite checks...</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        * Required components must be installed to continue
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          className="button button-primary"
          onClick={handleContinue}
          disabled={!allChecksPassed}
        >
          Continue
        </button>
      </div>

      {showManualInstructions && selectedInstructionKey && (
        <ManualInstructionsModal
          instructions={MANUAL_INSTRUCTIONS[selectedInstructionKey as keyof typeof MANUAL_INSTRUCTIONS]}
          onClose={() => setShowManualInstructions(false)}
        />
      )}
    </div>
  );
}
