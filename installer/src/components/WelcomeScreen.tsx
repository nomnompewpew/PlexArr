import type { SystemInfo } from '../types/installer';

interface WelcomeScreenProps {
  onStart: () => void;
  systemInfo: SystemInfo;
}

export default function WelcomeScreen({ onStart, systemInfo }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">🚀</div>
      <h1 className="welcome-title">Welcome to PlexArr Installer</h1>
      <p className="welcome-description">
        This installer will help you set up PlexArr on your system. We'll automatically detect
        and install all required dependencies including Docker and WSL2 (on Windows).
      </p>

      <div className="feature-list">
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <h3>Automatic Dependency Installation</h3>
            <p>We'll download and install Docker, WSL2, and other requirements automatically</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <h3>Resume After Reboot</h3>
            <p>Installation state is saved, so you can resume if a reboot is needed</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <h3>Manual Instructions Available</h3>
            <p>If automatic installation fails, we'll provide clear manual instructions</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <h3>Transparent Process</h3>
            <p>You'll see exactly what we're doing at every step</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">System Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Platform</div>
            <div style={{ fontWeight: 500 }}>{systemInfo.platform}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Architecture</div>
            <div style={{ fontWeight: 500 }}>{systemInfo.arch}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>OS Version</div>
            <div style={{ fontWeight: 500 }}>{systemInfo.osVersion}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hostname</div>
            <div style={{ fontWeight: 500 }}>{systemInfo.hostname}</div>
          </div>
          {systemInfo.distro && (
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Distribution</div>
              <div style={{ fontWeight: 500 }}>{systemInfo.distro} {systemInfo.distroVersion}</div>
            </div>
          )}
        </div>
      </div>

      <button className="button button-primary" onClick={onStart} style={{ marginTop: '2rem' }}>
        Start Installation
      </button>
    </div>
  );
}
