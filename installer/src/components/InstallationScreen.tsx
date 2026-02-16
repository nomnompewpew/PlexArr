import type { InstallationStateData, InstallationState } from '../types/installer';

interface InstallationScreenProps {
  state: InstallationStateData;
  onUpdateState: (updates: Partial<InstallationStateData>) => Promise<void>;
  onMoveToNextState: (state: InstallationState) => Promise<void>;
}

export default function InstallationScreen({ 
  state,
  onMoveToNextState 
}: InstallationScreenProps) {
  
  const handleComplete = async () => {
    await onMoveToNextState('completed');
  };

  const getStateMessage = () => {
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
      case 'installing_plexarr':
        return {
          title: 'Installing PlexArr',
          message: 'All prerequisites are met. Installing PlexArr...',
          action: 'Complete',
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

      {state.currentState === 'installing_plexarr' && (
        <div className="card">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '100%' }}></div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Installation complete!
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

      <button 
        className="button button-primary" 
        onClick={handleComplete}
        style={{ marginTop: '2rem' }}
      >
        {stateInfo.action}
      </button>
    </div>
  );
}
