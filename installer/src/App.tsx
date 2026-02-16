import { useEffect, useState } from 'react';
import './App.css';
import { stateService } from './services/stateService';
import { prerequisiteService } from './services/prerequisiteService';
import type { InstallationStateData, InstallationState } from './types/installer';
import WelcomeScreen from './components/WelcomeScreen';
import PrerequisiteScreen from './components/PrerequisiteScreen';
import InstallationScreen from './components/InstallationScreen';
import CompletedScreen from './components/CompletedScreen';
import ErrorScreen from './components/ErrorScreen';

function App() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<InstallationStateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load state from disk
      const savedState = await stateService.loadState();
      setState(savedState);
      
      // If we're resuming from a reboot or relogin, show a message
      if (savedState.resumeAfterReboot) {
        console.log('Resuming after reboot...');
        savedState.resumeAfterReboot = false;
        await stateService.saveState(savedState);
      }
      
      if (savedState.resumeAfterRelogin) {
        console.log('Resuming after re-login...');
        savedState.resumeAfterRelogin = false;
        await stateService.saveState(savedState);
      }

      setLoading(false);
    } catch (err) {
      setError(`Failed to initialize installer: ${err}`);
      setLoading(false);
    }
  };

  const updateState = async (updates: Partial<InstallationStateData>) => {
    if (!state) return;
    
    const newState = { ...state, ...updates };
    setState(newState);
    await stateService.saveState(newState);
  };

  const moveToNextState = async (nextState: InstallationState) => {
    await updateState({ currentState: nextState });
  };

  const handleStart = async () => {
    if (!state) return;

    // Run prerequisite checks
    const checks = await prerequisiteService.checkAll(state.systemInfo);
    await updateState({
      currentState: 'checking_prerequisites',
      checks,
    });
  };

  const renderScreen = () => {
    if (!state) return null;

    switch (state.currentState) {
      case 'initial':
        return <WelcomeScreen onStart={handleStart} systemInfo={state.systemInfo} />;
      
      case 'checking_prerequisites':
      case 'downloading_dependencies':
      case 'installing_wsl2':
      case 'installing_docker':
      case 'configuring_docker':
      case 'adding_to_docker_group':
        return (
          <PrerequisiteScreen
            state={state}
            onUpdateState={updateState}
            onMoveToNextState={moveToNextState}
          />
        );
      
      case 'rebooting_for_wsl2':
      case 'relogin_required':
        return (
          <InstallationScreen
            state={state}
            onUpdateState={updateState}
            onMoveToNextState={moveToNextState}
          />
        );
      
      case 'installing_plexarr':
        return (
          <InstallationScreen
            state={state}
            onUpdateState={updateState}
            onMoveToNextState={moveToNextState}
          />
        );
      
      case 'completed':
        return <CompletedScreen state={state} onMoveToNextState={moveToNextState} />;
      
      case 'failed':
        return (
          <ErrorScreen
            state={state}
            onRetry={() => moveToNextState('checking_prerequisites')}
            onReset={async () => {
              await stateService.clearState();
              await initializeApp();
            }}
          />
        );
      
      default:
        return <div>Unknown state: {state.currentState}</div>;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading installer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Start Installer</h2>
          <p>{error}</p>
          <button className="button button-primary" onClick={initializeApp}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>PlexArr Installer</h1>
        <div className="header-right">
          {state && (
            <div className="system-info">
              {state.systemInfo.platform} • {state.systemInfo.arch} • {state.systemInfo.osVersion}
            </div>
          )}
        </div>
      </div>
      <div className="content">
        {renderScreen()}
      </div>
      <div className="footer">
        <div>PlexArr Installer v1.0.0</div>
        <div className="text-secondary">
          {state && `State: ${state.currentState}`}
        </div>
      </div>
    </div>
  );
}

export default App;
