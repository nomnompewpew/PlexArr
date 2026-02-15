import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WizardPage from './pages/WizardPage';
import PostDeploymentWizard from './pages/PostDeploymentWizard';
import DashboardPage from './pages/DashboardPage';

function App() {
  const [deploymentCompleted, setDeploymentCompleted] = useState<boolean | null>(null);
  const [postSetupCompleted, setPostSetupCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    const deploymentDone = localStorage.getItem('plexarr_deployment_completed') === 'true';
    const postSetupDone = localStorage.getItem('plexarr_post_setup_completed') === 'true';
    setDeploymentCompleted(deploymentDone);
    setPostSetupCompleted(postSetupDone);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h1>PlexArr</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              deploymentCompleted ? (
                postSetupCompleted ?
                <Navigate to="/dashboard" replace /> :
                <Navigate to="/post-deployment-setup" replace />
              ) : 
              <Navigate to="/wizard" replace />
            } 
          />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/post-deployment-setup" element={<PostDeploymentWizard />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
