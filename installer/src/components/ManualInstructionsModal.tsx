import type { ManualInstructions } from '../types/installer';

interface ManualInstructionsModalProps {
  instructions: ManualInstructions;
  onClose: () => void;
}

export default function ManualInstructionsModal({ 
  instructions, 
  onClose 
}: ManualInstructionsModalProps) {
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{instructions.title}</h2>
          <button 
            className="button button-secondary" 
            onClick={onClose}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            {instructions.description}
          </p>

          <div className="card">
            <div className="card-title" style={{ fontSize: '1rem' }}>Official Download Link</div>
            <a 
              href={instructions.officialUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="link"
              style={{ wordBreak: 'break-all' }}
            >
              {instructions.officialUrl}
            </a>
          </div>

          <div className="card">
            <div className="card-title" style={{ fontSize: '1rem' }}>Installation Steps</div>
            <ol className="step-list">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {instructions.copyableCommands && instructions.copyableCommands.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ fontSize: '1rem' }}>
                Commands 
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  (Click to copy)
                </span>
              </div>
              {instructions.copyableCommands.map((command, index) => (
                <div 
                  key={index}
                  className="code-block"
                  style={{ cursor: 'pointer' }}
                  onClick={() => copyToClipboard(command)}
                  title="Click to copy"
                >
                  {command}
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            padding: '1rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: 'var(--warning-color)'
          }}>
            <strong>Note:</strong> After completing these steps manually, you may need to restart
            this installer to continue with the PlexArr setup.
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
