// Color-coded callout boxes for consistent information hierarchy
// Blue: Configuration/Value summaries
// Orange/Yellow: Warnings or dependencies  
// Green: Minimum requirements or success states
// Purple/Pink: Documentation and external links

import React, { ReactNode } from 'react';
import '../styles/CalloutBox.css';

export type CalloutType = 'blue' | 'orange' | 'green' | 'purple';

interface CalloutBoxProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
  icon?: string;
}

export const CalloutBox: React.FC<CalloutBoxProps> = ({
  type,
  title,
  children,
  icon
}) => {
  return (
    <div className={`callout-box callout-${type}`}>
      {(title || icon) && (
        <div className="callout-header">
          {icon && <span className="callout-icon">{icon}</span>}
          {title && <h3 className="callout-title">{title}</h3>}
        </div>
      )}
      <div className="callout-content">
        {children}
      </div>
    </div>
  );
};
