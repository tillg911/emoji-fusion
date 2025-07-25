import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveContainer = ({ children, className }: ResponsiveContainerProps) => {
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
        // Viewport constraints
        minHeight: '100vh',
        maxHeight: '100vh',
        height: '100vh',
        
        // Enable scrolling if content exceeds viewport
        overflowY: 'auto',
        overflowX: 'hidden',
        
        // Background and styling
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        
        // Responsive padding that scales with viewport
        padding: 'clamp(12px, 3vh, 20px)',
        boxSizing: 'border-box',
        
        // Smooth scrolling behavior
        scrollBehavior: 'smooth',
        
        // Ensure content never gets cut off
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '600px',
          
          // Allow content to take necessary space but not exceed viewport
          minHeight: 'fit-content',
          maxHeight: '100%',
          
          // Scale content proportionally on very small screens
          transform: 'scale(min(1, calc(100vh / 600px)))',
          transformOrigin: 'center center',
          
          // Responsive gap between elements
          gap: 'clamp(12px, 2vh, 20px)',
        }}
      >
        {children}
      </div>
    </div>
  );
};