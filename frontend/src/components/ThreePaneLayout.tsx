// Unified three-pane layout component for PlexArr
// Used by Wizard, Dashboard, and PostDeploymentWizard for consistent UI

import React, { ReactNode } from 'react';
import '../styles/ThreePaneLayout.css';

interface ThreePaneLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  sidebarWidth?: string;
}

export const ThreePaneLayout: React.FC<ThreePaneLayoutProps> = ({
  sidebar,
  children,
  footer,
  sidebarWidth = '300px'
}) => {
  return (
    <div className="three-pane-layout">
      {/* Persistent Sidebar */}
      <aside className="three-pane-sidebar" style={{ width: sidebarWidth }}>
        {sidebar}
      </aside>

      {/* Fluid Main Canvas */}
      <main className="three-pane-main">
        <div className="three-pane-content">
          {children}
        </div>

        {/* Fixed Navigation Bar (Bottom) */}
        {footer && (
          <div className="three-pane-footer">
            {footer}
          </div>
        )}
      </main>
    </div>
  );
};
