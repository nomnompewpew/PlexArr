import type { InstallationStateData } from '../types/installer';

interface ErrorScreenProps {
  state: InstallationStateData;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorScreen({ state, onRetry, onReset }: ErrorScreenProps) {
  const copyLogs = async () => {
    const logs = state.errors.join('\n');
    try {
      await navigator.clipboard.writeText(logs);
      alert('Error logs copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ marginBottom: '1rem' }}>Installation Failed</h2>
        <p className="card-description">
          The installation encountered errors. Please review the details below.
        </p>
      </div>

      <div className="card">
        <div className="card-title">Error Details</div>
        {state.errors.length > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            {state.errors.map((error, index) => (
              <div 
                key={index} 
                className="code-block"
                style={{ marginBottom: '0.5rem', color: 'var(--error-color)' }}
              >
                {error}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            No specific error details available.
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-title">Recovery Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="button button-primary" onClick={onRetry}>
            Retry Installation
          </button>
          <button className="button button-secondary" onClick={copyLogs}>
            Copy Error Logs
          </button>
          <button className="button button-secondary" onClick={onReset}>
            Start Over
          </button>
        </div>
      </div>

      <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
        <div style={{ fontSize: '0.875rem' }}>
          <strong style={{ color: 'var(--error-color)' }}>Need Help?</strong>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            If you continue to experience issues, please:
          </p>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li style={{ marginTop: '0.25rem' }}>Copy the error logs using the button above</li>
            <li style={{ marginTop: '0.25rem' }}>Visit the PlexArr GitHub repository</li>
            <li style={{ marginTop: '0.25rem' }}>Create an issue with the error logs attached</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Manual Installation</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          You can also install PlexArr manually by following the instructions in the 
          <a 
            href="https://github.com/nomnompewpew/PlexArr#installation" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link"
            style={{ marginLeft: '0.25rem' }}
          >
            README
          </a>.
        </p>
      </div>
    </div>
  );
}
