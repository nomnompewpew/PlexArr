import { useEffect, useState } from 'react';
import type { InstallationStateData, InstallationState, PrerequisiteCheck } from '../types/installer';
import { installationService } from '../services/installationService';
import { prerequisiteService } from '../services/prerequisiteService';
import PasswordPromptModal from './PasswordPromptModal';

interface InstallationProgress {
  status: string;
  progress: number;
  message: string;
}

interface InstallationScreenProps {
  state: InstallationStateData;
  onUpdateState: (updates: Partial<InstallationStateData>) => Promise<void>;
  onMoveToNextState: (state: InstallationState) => Promise<void>;
}

export default function InstallationScreen({ 
  state,
  onUpdateState,
  onMoveToNextState 
}: InstallationScreenProps) {
  const [progress, setProgress] = useState<InstallationProgress>({
    status: 'waiting',
    progress: 0,
    message: 'Starting installation...'
  });
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordPromiseResolver, setPasswordPromiseResolver] = useState<((password: string) => void) | null>(null);

  useEffect(() => {
    if (state.currentState === 'installing_plexarr' && !installing) {
      runInstallation();
    }
  }, [state.currentState]);

  const runInstallation = async () => {
    setInstalling(true);
    setError(null);

    try {
      // Set up progress callback
      installationService.setProgressCallback((prog) => {
        setProgress(prog);
      });

      // Set up password callback - when installation service needs a password
      installationService.setPasswordCallback(async () => {
        return new Promise<string>((resolve) => {
          setShowPasswordPrompt(true);
          setPasswordPromiseResolver(() => resolve);
        });
      });

      // Run the installation
      await installationService.installPlexArr(state.systemInfo);

      // Update state with completion
      await onUpdateState({ currentState: 'installing_plexarr' });

      // Re-check prerequisites to get current status for completion screen
      const updatedChecks = await prerequisiteService.checkAll(state.systemInfo);
      
      // Update state with latest prerequisite checks
      await onUpdateState({
        checks: updatedChecks,
        dockerInstalled: updatedChecks.some((c: PrerequisiteCheck) => c.name === 'Docker' && c.status === 'passed'),
        wsl2Installed: updatedChecks.some((c: PrerequisiteCheck) => c.name === 'WSL2' && c.status === 'passed'),
        userInDockerGroup: updatedChecks.some((c: PrerequisiteCheck) => c.name === 'Docker Group' && c.status === 'passed')
      });

      // Move to completed state
      await onMoveToNextState('completed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error('Installation error:', err);
      setInstalling(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordPrompt(false);
    if (passwordPromiseResolver) {
      passwordPromiseResolver(password);
      setPasswordPromiseResolver(null);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setError('Installation cancelled by user');
    setInstalling(false);
    if (passwordPromiseResolver) {
      setPasswordPromiseResolver(null);
    }
  };

  const handleComplete = async () => {
    await onMoveToNextState('completed');
  };

  const getStateMessage = () => {
    if (state.currentState === 'installing_plexarr') {
      return {
        title: 'Installing PlexArr',
        message: progress.message || 'Installing...',
        showProgress: true,
      };
    }

    switch (state.currentState) {
      case 'rebooting_for_wsl2':
        return {
          title: 'Reboot Required for WSL2',
          message: 'WSL2 installation requires a system reboot. Please save your work and restart your computer.',
          action: 'Reboot Now',
        };
      case 'relogin_required':
        return {
          title: 'Re-login Required',
          message: 'You have been added to the docker group. Please log out and log back in for the changes to take effect.',
          action: 'I\'ve Re-logged',
        };
      default:
        return {
          title: 'Installing',
          message: 'Please wait...',
          action: 'Continue',
        };
    }
  };

  const stateInfo = getStateMessage();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div className="loading-icon" style={{ fontSize: '4rem', marginBottom: '2rem' }}>
        {state.currentState === 'rebooting_for_wsl2' ? '🔄' : 
         state.currentState === 'relogin_required' ? '👤' : 
         '⚙️'}
      </div>

      <h2 style={{ marginBottom: '1rem' }}>{stateInfo.title}</h2>
      <p className="card-description" style={{ marginBottom: '2rem' }}>
        {stateInfo.message}
      </p>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--error-color)', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--error-color)', textAlign: 'left' }}>
            <strong>Installation Error:</strong>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>
          </div>
          <button 
            className="button button-primary" 
            onClick={runInstallation}
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {state.currentState === 'installing_plexarr' && !error && (
        <div className="card">
          <div className="progress-bar" style={{ marginBottom: '1rem' }}>
            <div className="progress-fill" style={{ width: `${progress.progress}%`, transition: 'width 0.3s ease' }}></div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {progress.progress}% - {progress.status}
          </p>
        </div>
      )}

      {(state.currentState === 'rebooting_for_wsl2' || state.currentState === 'relogin_required') && (
        <div className="card">
          <div className="card-title" style={{ fontSize: '1rem' }}>What Happens Next?</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {state.currentState === 'rebooting_for_wsl2' 
              ? 'After rebooting, this installer will automatically resume where you left off.'
              : 'After re-logging, this installer will automatically detect the change and continue.'}
          </p>
        </div>
      )}

      {!installing && (
        <button 
          className="button button-primary" 
          onClick={handleComplete}
          style={{ marginTop: '2rem' }}
        >
          {state.currentState === 'rebooting_for_wsl2' || state.currentState === 'relogin_required'
            ? (state.currentState === 'rebooting_for_wsl2' ? 'Reboot Now' : 'I\'ve Re-logged')
            : 'Continue'}
        </button>
      )}

      {showPasswordPrompt && (
        <PasswordPromptModal
          onConfirm={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
        />
      )}
    </div>
  );
}
