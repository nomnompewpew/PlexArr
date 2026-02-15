// Setup instructions display component for post-deployment wizard

import React, { useState } from 'react';
import { api } from '../services/api';
import '../styles/SetupInstructions.css';

interface SetupInstructionsProps {
  service: string;
  title: string;
  minimumSteps: string[];
  externalLinks: { label: string; url: string }[];
  contextValues: Record<string, string>;
  specialNotes?: string;
  onCredentialsRetrieved?: (credentials: any) => void;
}

export const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  service,
  title,
  minimumSteps,
  externalLinks,
  contextValues,
  specialNotes,
  onCredentialsRetrieved
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  const handleGetCredentials = async () => {
    if (service === 'nzbget' || service === 'nzbgetMusic' || service === 'qbittorrent') {
      setLoadingCreds(true);
      setCredError(null);
      try {
        const res = await api.get(`/deploy-new/credentials/${service}`);
        setCredentials(res.data);
        if (onCredentialsRetrieved) {
          onCredentialsRetrieved(res.data);
        }
      } catch (error: any) {
        setCredError(error?.response?.data?.message || 'Failed to retrieve credentials');
      } finally {
        setLoadingCreds(false);
      }
    }
  };

  // Check if this service has special credential handling
  const needsCredentials = ['nzbget', 'nzbgetMusic', 'qbittorrent'].includes(service);

  return (
    <div className="setup-instructions-container">
      <div className="instructions-header">
        <h2 className="instructions-title">📋 {title}</h2>
        {specialNotes && (
          <div className="special-notes">{specialNotes}</div>
        )}
      </div>

      {/* Context Values - Pre-populated from config */}
      {Object.keys(contextValues).length > 0 && (
        <div className="context-section">
          <h3>📌 Your Configuration Values</h3>
          <p className="context-subtitle">
            Copy these into {title} setup - they're already configured:
          </p>
          <div className="context-values">
            {Object.entries(contextValues).map(([key, value]) => (
              <div key={key} className="context-item">
                <span className="context-label">{key}:</span>
                <code
                  className="context-value"
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                  }}
                  title="Click to copy"
                >
                  {value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credentials Section */}
      {needsCredentials && (
        <div className="credentials-section">
          <h3>🔐 Default Credentials</h3>
          <p className="credentials-subtitle">
            Click below to retrieve the default password from Docker logs:
          </p>
          <button
            className="btn-credentials"
            onClick={handleGetCredentials}
            disabled={loadingCreds}
          >
            {loadingCreds ? '⏳ Retrieving...' : '🔑 Get Default Credentials'}
          </button>

          {credentials && (
            <div className="credentials-display">
              <div className="credential-item">
                <span className="cred-label">Username:</span>
                <code className="cred-value">{credentials.username}</code>
              </div>
              <div className="credential-item">
                <span className="cred-label">Password:</span>
                <code className="cred-value" title="Click to copy">
                  {credentials.password}
                </code>
              </div>
              <p className="credentials-warning">
                ⚠️ <strong>IMPORTANT:</strong> Change this password immediately after first login!
              </p>
            </div>
          )}

          {credError && (
            <div className="error-message">
              ❌ {credError}
              <p className="error-fallback">
                If automatic retrieval fails, run in terminal:
                <code>docker compose logs {service}</code>
                Look for "Default password" in the output.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Setup Steps */}
      <div className="steps-section">
        <h3>✅ Setup Steps (Minimum Required)</h3>
        <ol className="setup-steps">
          {minimumSteps.map((step, idx) => (
            <li key={idx} className="step-item">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* External Links */}
      {externalLinks.length > 0 && (
        <div className="links-section">
          <h3>🔗 Useful Links</h3>
          <div className="external-links">
            {externalLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="instructions-note">
        💡 <strong>Pro Tip:</strong> These are the MINIMUM steps. Each service has many more options
        in its settings. This wizard gets you running - you can fine-tune later.
      </div>
    </div>
  );
};
