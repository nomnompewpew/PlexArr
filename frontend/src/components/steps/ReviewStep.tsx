// Review and deploy step

import React, { useState } from 'react';

interface Props {
  config: any; // PlexArrConfig
  onDeploy: () => Promise<void>;
}

export const ReviewStep: React.FC<Props> = ({ config, onDeploy }) => {
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await onDeploy();
      setResult({ success: true });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    }
    setDeploying(false);
  };

  const enabledServices = Object.entries(config.services)
    .filter(([, svc]: any) => svc.enabled)
    .map(([name, svc]: any) => ({ name, ...svc }));

  return (
    <div>
      <h2>Review & Deploy</h2>

      <h3>System</h3>
      <pre>{JSON.stringify(config.system, null, 2)}</pre>

      <h3>Storage</h3>
      <pre>{JSON.stringify(config.storage, null, 2)}</pre>

      <h3>Services ({enabledServices.length} enabled)</h3>
      <table>
        <thead><tr><th>Service</th><th>Port</th></tr></thead>
        <tbody>
          {enabledServices.map((svc: any) => (
            <tr key={svc.name}><td>{svc.name}</td><td>{svc.port}</td></tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleDeploy} disabled={deploying}>
          {deploying ? 'Deploying…' : '🚀 Deploy Stack'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 16, color: result.success ? 'green' : 'red' }}>
          {result.success ? '✓ Stack deployed successfully!' : `✗ ${result.message}`}
        </div>
      )}
    </div>
  );
};
