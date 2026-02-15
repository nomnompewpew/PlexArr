// AI Agent configuration step for automated setup assistance

import React, { useState } from 'react';
import { AIAgentConfig } from '../../types/plexarr-config.types';

interface Props {
  aiAgent?: AIAgentConfig;
  onChange: (aiAgent?: AIAgentConfig) => void;
}

const AI_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', description: 'Google\'s Gemini AI' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4 and other OpenAI models' },
  { value: 'anthropic', label: 'Anthropic Claude', description: 'Claude AI assistant' },
] as const;

export const AIAgentStep: React.FC<Props> = ({ aiAgent, onChange }) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange({
        enabled: true,
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-pro',
      });
    } else {
      onChange(undefined);
    }
  };

  const updateConfig = (updates: Partial<AIAgentConfig>) => {
    if (!aiAgent) return;
    onChange({ ...aiAgent, ...updates });
  };

  return (
    <div>
      <h2>AI Agent Assistant (Optional)</h2>
      <p>
        Enable an AI agent to help with configuration and setup. The AI can analyze your
        services and provide recommendations for optimal configuration.
      </p>

      <div style={{ marginTop: 24 }}>
        <label>
          <input
            type="checkbox"
            checked={aiAgent?.enabled || false}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <strong style={{ marginLeft: 8 }}>Enable AI Agent Assistant</strong>
        </label>
      </div>

      {aiAgent?.enabled && (
        <div style={{ marginTop: 24, marginLeft: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label>
              <strong>AI Provider:</strong>
              <select
                value={aiAgent.provider}
                onChange={(e) => updateConfig({ provider: e.target.value as AIAgentConfig['provider'] })}
                style={{ marginLeft: 8, padding: 4, width: 200 }}
              >
                {AI_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ marginLeft: 120, marginTop: 4, color: '#888', fontSize: 12 }}>
              {AI_PROVIDERS.find((p) => p.value === aiAgent.provider)?.description}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>
              <strong>API Key:</strong>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiAgent.apiKey || ''}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder="Enter your API key"
                style={{ marginLeft: 8, padding: 4, width: 300 }}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ marginLeft: 8, padding: 4 }}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </label>
            <div style={{ marginLeft: 120, marginTop: 4, color: '#888', fontSize: 12 }}>
              Your API key is encrypted and stored securely
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>
              <strong>Model:</strong>
              <input
                type="text"
                value={aiAgent.model || ''}
                onChange={(e) => updateConfig({ model: e.target.value })}
                placeholder={aiAgent.provider === 'gemini' ? 'gemini-pro' : 'gpt-4'}
                style={{ marginLeft: 8, padding: 4, width: 200 }}
              />
            </label>
            <div style={{ marginLeft: 120, marginTop: 4, color: '#888', fontSize: 12 }}>
              Optional: Specify a custom model (uses default if empty)
            </div>
          </div>

          <div style={{ 
            marginTop: 24, 
            padding: 12, 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #333',
            borderRadius: 4 
          }}>
            <h4 style={{ marginTop: 0, color: '#4a9eff' }}>What can the AI Agent do?</h4>
            <ul style={{ marginBottom: 0 }}>
              <li>Analyze your service configuration for optimal settings</li>
              <li>Suggest indexers and download clients for Prowlarr</li>
              <li>Recommend quality profiles for Radarr, Sonarr, and Lidarr</li>
              <li>Help troubleshoot connection issues between services</li>
              <li>Provide guidance on WireGuard VPN setup for secure access</li>
            </ul>
          </div>

          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#2a1a1a', 
            border: '1px solid #663333',
            borderRadius: 4 
          }}>
            <h4 style={{ marginTop: 0, color: '#ff9999' }}>Privacy Notice</h4>
            <p style={{ marginBottom: 0, fontSize: 12 }}>
              The AI agent will only have access to your service configuration metadata.
              It will not have access to your media files, API keys (except its own), or
              personal data. All communication with the AI service is encrypted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
