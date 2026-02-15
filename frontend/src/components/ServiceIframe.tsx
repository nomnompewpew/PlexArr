import React from 'react';
import '../styles/ServiceIframe.css';

interface ServiceIframeProps {
  serviceName: string;
  label: string;
  port: number;
  basePath?: string;
  icon: string;
}

export const ServiceIframe: React.FC<ServiceIframeProps> = ({ 
  serviceName, 
  label, 
  port, 
  basePath = '',
  icon 
}) => {
  const iframeUrl = `http://localhost:${port}${basePath}`;

  return (
    <div className="service-iframe-container">
      {/* Header with service info */}
      <div className="service-iframe-header">
        <div className="service-iframe-title">
          <span className="service-iframe-icon">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="service-iframe-info">
          <span className="service-port">Port: {port}</span>
          <a 
            href={iframeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="service-iframe-link"
            title="Open in new tab"
          >
            🔗
          </a>
        </div>
      </div>

      {/* IFrame Wrapper */}
      <div className="service-iframe-wrapper">
        <iframe
          src={iframeUrl}
          title={`${label} Service`}
          className="service-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
        />
      </div>

      {/* Fallback message */}
      <div className="service-iframe-fallback">
        <p>The service interface is loading...</p>
        <p style={{ fontSize: '12px', color: '#999' }}>
          If this doesn't load, {label} may not be running. Check the dashboard logs.
        </p>
      </div>
    </div>
  );
};

export default ServiceIframe;
