import type { InstallationStateData } from '../types/installer';

interface CompletedScreenProps {
  state: InstallationStateData;
}

export default function CompletedScreen({ state }: CompletedScreenProps) {
  const handleLaunchPlexArr = () => {
    // Open PlexArr in browser
    window.open('http://localhost:3000', '_blank');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>🎉</div>
      
      <h2 style={{ marginBottom: '1rem' }}>Installation Complete!</h2>
      <p className="card-description" style={{ marginBottom: '2rem' }}>
        PlexArr has been successfully installed on your system.
      </p>

      <div className="card" style={{ textAlign: 'left' }}>
        <div className="card-title">Installation Summary</div>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Platform</div>
            <div style={{ fontWeight: 500 }}>{state.systemInfo.platform}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Docker</div>
            <div style={{ fontWeight: 500 }}>
              {state.dockerInstalled ? '✓ Installed' : '✗ Not installed'}
            </div>
          </div>
          {state.systemInfo.platform === 'windows' && (
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>WSL2</div>
              <div style={{ fontWeight: 500 }}>
                {state.wsl2Installed ? '✓ Installed' : '✗ Not installed'}
              </div>
            </div>
          )}
          {state.systemInfo.platform === 'linux' && (
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Docker Group</div>
              <div style={{ fontWeight: 500 }}>
                {state.userInDockerGroup ? '✓ User added' : '○ Not configured'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <div className="card-title">Next Steps</div>
        <ol className="step-list">
          <li>Launch PlexArr by clicking the button below</li>
          <li>Complete the setup wizard to configure your media services</li>
          <li>Follow the post-deployment wizard to connect all services</li>
          <li>Start managing your media library!</li>
        </ol>
      </div>

      <div className="card" style={{ textAlign: 'left', background: 'rgba(59, 130, 246, 0.1)' }}>
        <div style={{ fontSize: '0.875rem' }}>
          <strong style={{ color: 'var(--primary-color)' }}>💡 Tip:</strong> PlexArr will be
          available at <code style={{ 
            background: 'var(--surface)', 
            padding: '0.125rem 0.375rem', 
            borderRadius: '0.25rem' 
          }}>http://localhost:3000</code>
        </div>
      </div>

      <button 
        className="button button-success" 
        onClick={handleLaunchPlexArr}
        style={{ marginTop: '2rem' }}
      >
        Launch PlexArr
      </button>
    </div>
  );
}
