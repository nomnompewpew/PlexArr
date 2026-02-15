import React, { useEffect, useState } from 'react';
import { RequestType } from './RequestBar';
import '../styles/RequestModal.css';

interface RequestModalProps {
  isOpen: boolean;
  type: RequestType;
  query: string;
  onClose: () => void;
}

// Service port mapping
const servicePortMap: Record<RequestType, { port: number; path?: string }> = {
  movies: { port: 5055, path: '/search' },      // Overseerr
  tv: { port: 5055, path: '/search' },           // Overseerr
  music: { port: 8686, path: '/search' },        // Lidarr
  youtube: { port: 8081, path: '' }              // MeTube
};

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, type, query, onClose }) => {
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const portInfo = servicePortMap[type];
      const basePath = portInfo.path || '';
      const searchParam = encodeURIComponent(query);
      const url = `http://localhost:${portInfo.port}${basePath}?q=${searchParam}`;
      setIframeUrl(url);
    }
  }, [isOpen, type, query]);

  if (!isOpen) return null;

  const getTypeLabel = (): string => {
    switch (type) {
      case 'movies': return '🎬 Request Movie';
      case 'tv': return '📺 Request TV Show';
      case 'music': return '🎵 Request Music';
      case 'youtube': return '📹 Download from YouTube';
      default: return 'Request Media';
    }
  };

  const getServiceName = (): string => {
    switch (type) {
      case 'movies':
      case 'tv':
        return 'Overseerr';
      case 'music':
        return 'Lidarr';
      case 'youtube':
        return 'MeTube';
      default:
        return 'Service';
    }
  };

  return (
    <div className="request-modal-overlay" onClick={onClose}>
      <div className="request-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="request-modal-header">
          <h2>{getTypeLabel()}</h2>
          <button 
            className="request-modal-close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Service Info */}
        <div className="request-modal-info">
          <p>Showing {getServiceName()} interface for: <strong>"{query}"</strong></p>
        </div>

        {/* Service IFrame */}
        <div className="request-modal-iframe-container">
          <iframe
            src={iframeUrl}
            title={`${getServiceName()} - ${type}`}
            className="request-modal-iframe"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
          />
        </div>

        {/* Footer */}
        <div className="request-modal-footer">
          <p className="request-modal-tip">
            💡 Tip: Make your selection in {getServiceName()} and the request will be added to your collection.
          </p>
          <button 
            className="request-modal-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
