import { ReactNode } from 'react';
import { DESIGN_TOKENS } from '../constants/design-system';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  allowScroll?: boolean;
}

export const ResponsiveContainer = ({ 
  children, 
  className, 
  allowScroll = true 
}: ResponsiveContainerProps) => {
  const { isMobile } = useResponsive();
  
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
        // Viewport constraints - use dvh for better mobile support
        minHeight: '100dvh',
        maxHeight: '100dvh',
        height: '100dvh',
        width: '100vw',
        
        // Enable scrolling if content exceeds viewport
        overflowY: allowScroll ? 'auto' : 'hidden',
        overflowX: 'hidden',
        
        // Background and styling
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        
        // Mobile-optimized padding - reduced for better centering
        padding: isMobile 
          ? `clamp(${DESIGN_TOKENS.spacing.sm}, 2vh, ${DESIGN_TOKENS.spacing.lg})`
          : `clamp(${DESIGN_TOKENS.spacing.md}, 3vh, ${DESIGN_TOKENS.spacing.xl})`,
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
          justifyContent: isMobile ? 'center' : 'flex-start',
          width: '100%',
          maxWidth: DESIGN_TOKENS.layout.maxContainerWidth,
          
          // Mobile-specific height handling for better centering
          minHeight: isMobile ? '100%' : 'fit-content',
          maxHeight: '100%',
          height: isMobile ? '100%' : 'auto',
          
          // Mobile-optimized gap - smaller on mobile for better centering
          gap: isMobile 
            ? `clamp(${DESIGN_TOKENS.spacing.sm}, 1.5vh, ${DESIGN_TOKENS.spacing.md})`
            : `clamp(${DESIGN_TOKENS.spacing.md}, 2vh, ${DESIGN_TOKENS.spacing.xl})`,
          
          // Ensure content is properly contained
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};