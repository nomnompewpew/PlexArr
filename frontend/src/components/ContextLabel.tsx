// Context label component to clarify field purposes

import React from 'react';

interface ContextLabelProps {
  type: 'user-config' | 'system-default' | 'advanced' | 'optional' | 'important';
  text: string;
}

export const ContextLabel: React.FC<ContextLabelProps> = ({ type, text }) => {
  const styles: Record<string, React.CSSProperties> = {
    'user-config': {
      backgroundColor: '#e3f2fd',
      borderLeft: '4px solid #2196F3',
      padding: '8px 12px',
      marginTop: '6px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#1565c0',
      fontWeight: '500'
    },
    'system-default': {
      backgroundColor: '#f5f5f5',
      borderLeft: '4px solid #9e9e9e',
      padding: '8px 12px',
      marginTop: '6px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#616161',
      fontWeight: '500'
    },
    'advanced': {
      backgroundColor: '#fff3e0',
      borderLeft: '4px solid #ff9800',
      padding: '8px 12px',
      marginTop: '6px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#e65100',
      fontWeight: '500'
    },
    'optional': {
      backgroundColor: '#f3e5f5',
      borderLeft: '4px solid #9c27b0',
      padding: '8px 12px',
      marginTop: '6px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#6a1b9a',
      fontWeight: '500'
    },
    'important': {
      backgroundColor: '#ffebee',
      borderLeft: '4px solid #f44336',
      padding: '8px 12px',
      marginTop: '6px',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#c62828',
      fontWeight: '500'
    }
  };

  const icons: Record<string, string> = {
    'user-config': '👤',
    'system-default': '⚙️',
    'advanced': '🔧',
    'optional': '✨',
    'important': '⚠️'
  };

  return (
    <div style={styles[type]}>
      <span>{icons[type]} {text}</span>
    </div>
  );
};
