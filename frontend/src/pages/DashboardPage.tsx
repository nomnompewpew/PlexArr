import React from 'react';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>🎬 PlexArr Dashboard</h1>
        <p>Manage your unified Plex media server</p>
      </header>

      <div className="dashboard-content">
        <div className="info-card">
          <h2>Setup Complete!</h2>
          <p>Your PlexArr configuration has been saved.</p>
          <p>To deploy your stack, run:</p>
          <pre>
            <code>docker-compose up -d</code>
          </pre>
          <p className="help-text">
            After deployment, services will be accessible at their configured ports.
            The API coordination will run automatically to connect all services together.
          </p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <h3>Plex Media Server</h3>
            <p>Stream your media</p>
            <a href="http://localhost:32400/web" target="_blank" rel="noopener noreferrer">
              Open Plex →
            </a>
          </div>

          <div className="service-card">
            <h3>Radarr</h3>
            <p>Manage movies</p>
            <a href="http://localhost:7878" target="_blank" rel="noopener noreferrer">
              Open Radarr →
            </a>
          </div>

          <div className="service-card">
            <h3>Sonarr</h3>
            <p>Manage TV shows</p>
            <a href="http://localhost:8989" target="_blank" rel="noopener noreferrer">
              Open Sonarr →
            </a>
          </div>

          <div className="service-card">
            <h3>Prowlarr</h3>
            <p>Manage indexers</p>
            <a href="http://localhost:9696" target="_blank" rel="noopener noreferrer">
              Open Prowlarr →
            </a>
          </div>

          <div className="service-card">
            <h3>Lidarr</h3>
            <p>Manage music</p>
            <a href="http://localhost:8686" target="_blank" rel="noopener noreferrer">
              Open Lidarr →
            </a>
          </div>

          <div className="service-card">
            <h3>Overseerr</h3>
            <p>Request media</p>
            <a href="http://localhost:5055" target="_blank" rel="noopener noreferrer">
              Open Overseerr →
            </a>
          </div>

          <div className="service-card">
            <h3>Maintainerr</h3>
            <p>Manage collections</p>
            <a href="http://localhost:6246" target="_blank" rel="noopener noreferrer">
              Open Maintainerr →
            </a>
          </div>

          <div className="service-card">
            <h3>NZBGet</h3>
            <p>Download client</p>
            <a href="http://localhost:6789" target="_blank" rel="noopener noreferrer">
              Open NZBGet →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
