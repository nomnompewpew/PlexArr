import React, { useState } from 'react';
import '../styles/RequestBar.css';

export type RequestType = 'movies' | 'tv' | 'music' | 'youtube';

interface RequestBarProps {
  onRequest: (type: RequestType, query: string) => void;
}

export const RequestBar: React.FC<RequestBarProps> = ({ onRequest }) => {
  const [selectedType, setSelectedType] = useState<RequestType>('movies');
  const [searchQuery, setSearchQuery] = useState('');

  const typeOptions: Array<{ value: RequestType; label: string; icon: string }> = [
    { value: 'movies', label: 'Movies', icon: '🎬' },
    { value: 'tv', label: 'TV Shows', icon: '📺' },
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📹' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onRequest(selectedType, searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <div className="request-bar">
      <div className="request-bar-container">
        <div className="request-bar-title">
          <span className="request-bar-icon">🔍</span>
          <span>Request Media</span>
        </div>

        <form onSubmit={handleSubmit} className="request-bar-form">
          {/* Type Selector */}
          <div className="request-type-selector">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`request-type-btn ${selectedType === option.value ? 'active' : ''}`}
                onClick={() => setSelectedType(option.value)}
                title={option.label}
              >
                <span className="request-type-icon">{option.icon}</span>
                <span className="request-type-label">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="request-search-container">
            <input
              type="text"
              className="request-search-input"
              placeholder={`Search for ${typeOptions.find(t => t.value === selectedType)?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="request-submit-btn"
              disabled={!searchQuery.trim()}
            >
              Search & Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestBar;
