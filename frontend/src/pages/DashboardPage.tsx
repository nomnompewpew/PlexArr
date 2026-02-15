import React from 'react';
import { Dashboard } from '../components/Dashboard';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>🎬 PlexArr Dashboard</h1>
        <p>Monitor your stack and coordination status</p>
      </header>

      <div className="dashboard-content">
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
