// Dashboard component for stack health monitoring

import React, { useEffect, useState } from 'react';

interface Container {
  Name: string;
  State: string;
  Status: string;
}

export const Dashboard: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [coordStatus, setCoordStatus] = useState<any>(null);

  const refresh = async () => {
    const res = await fetch('/api/deploy-new/status');
    const data = await res.json();
    setContainers(data.containers || []);
  };

  const runCoordination = async () => {
    setCoordStatus({ running: true });
    const res = await fetch('/api/coordinate', { method: 'POST' });
    const result = await res.json();
    setCoordStatus(result);
  };

  useEffect(() => { 
    refresh(); 
    const id = setInterval(refresh, 10000); 
    return () => clearInterval(id); 
  }, []);

  return (
    <div>
      <h2>Stack Status</h2>
      <button onClick={refresh}>Refresh</button>
      <table>
        <thead><tr><th>Container</th><th>State</th><th>Status</th></tr></thead>
        <tbody>
          {containers.map(c => (
            <tr key={c.Name}>
              <td>{c.Name}</td>
              <td style={{ color: c.State === 'running' ? 'green' : 'red' }}>{c.State}</td>
              <td>{c.Status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Service Coordination</h2>
      <button onClick={runCoordination} disabled={coordStatus?.running}>
        {coordStatus?.running ? 'Running…' : 'Run Coordination'}
      </button>
      {coordStatus && !coordStatus.running && (
        <pre>{JSON.stringify(coordStatus, null, 2)}</pre>
      )}
    </div>
  );
};
