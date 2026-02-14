import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WizardPage from './pages/WizardPage';
import DashboardPage from './pages/DashboardPage';
import { api } from './services/api';

function App() {
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await api.get('/config');
      setSetupCompleted(response.data.exists && response.data.config.setup_completed);
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupCompleted(false);
    } finally {
      setLoading(false);
    }
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
