import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WizardPage from './pages/WizardPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    const completed = localStorage.getItem('plexarr_setup_completed') === 'true';
    setSetupCompleted(completed);
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
              setupCompleted ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/wizard" replace />
            } 
          />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
