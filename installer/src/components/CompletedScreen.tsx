import { useState } from 'react';
import { open } from '@tauri-apps/api/shell';
import type { InstallationStateData, InstallationState, PrerequisiteCheck } from '../types/installer';
import { prerequisiteService } from '../services/prerequisiteService';

interface CompletedScreenProps {
  state: InstallationStateData;
  onMoveToNextState: (state: InstallationState) => Promise<void>;
}

export default function CompletedScreen({ state, onMoveToNextState }: CompletedScreenProps) {
  const [validationResults, setValidationResults] = useState<PrerequisiteCheck[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateServices = async () => {
    setIsValidating(true);
    try {
      const results = await prerequisiteService.checkAll(state.systemInfo);
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLaunchPlexArr = async () => {
    try {
      // Use Tauri's shell API to open the URL in the system browser
      await open('http://localhost:3000');
    } catch (error) {
      console.error('Failed to open URL:', error);
      // Fallback to window.open if Tauri method fails
      window.open('http://localhost:3000', '_blank');
    }
  };

  const handleReinstall = async () => {
    // Reset to initial state to restart installer
    await onMoveToNextState('initial');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
      
      <h2 style={{ marginBottom: '0.5rem' }}>PlexArr Launcher</h2>
      <p className="card-description" style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
        PlexArr has been installed. Use this launcher to verify services and access your media server.
      </p>

      {/* Service Validation Card */}
      <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Service Status</span>
          <button 
            className="button button-small"
            onClick={handleValidateServices}
            disabled={isValidating}
            style={{ marginBottom: 0 }}
          >
            {isValidating ? '⟳ Validating...' : '⟲ Validate Services'}
          </button>
        </div>

        {validationResults ? (
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            {validationResults.map((check) => {
              // Filter to only show relevant checks
              if (!['Docker', 'Docker Compose', 'Docker Group', 'Disk Space'].includes(check.name)) {
                return null;
              }
              
              const isPass = check.status === 'passed';
              const statusIcon = isPass ? '✓' : '✗';
              const statusColor = isPass ? '#10b981' : '#ef4444';
              
              return (
                <div key={check.name} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: statusColor, fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {statusIcon}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {check.name}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: isPass ? 'var(--text-primary)' : '#dc2626' }}>
                        {check.message}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            padding: '1.5rem', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            background: 'var(--surface)',
            borderRadius: '0.5rem'
          }}>
            <p style={{ marginBottom: 0 }}>Click "Validate Services" to check Docker and PlexArr status</p>
          </div>
        )}
      </div>

      {/* Quick Access Card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="card-title">Quick Access</div>
        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>PlexArr is running at:</p>
          <div style={{ 
            background: 'var(--surface)', 
            padding: '0.75rem', 
            borderRadius: '0.5rem',
            fontFamily: 'monospace',
            color: 'var(--primary-color)',
            fontWeight: 500
          }}>
            http://localhost:3000
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <button 
          className="button button-success"
          onClick={handleLaunchPlexArr}
          style={{ marginTop: 0 }}
        >
          → Launch PlexArr
        </button>
        <button 
          className="button"
          onClick={handleReinstall}
          style={{ marginTop: 0, background: 'var(--surface)', color: 'var(--text-primary)' }}
        >
          ⟲ Reinstall
        </button>
      </div>

      {/* Help Text */}
      <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <p>💡 Run this launcher anytime to verify services are running and access PlexArr</p>
      </div>
    </div>
  );
}
