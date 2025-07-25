import { useEffect, useState } from 'react';

// Add CSS keyframes for shine animation
const shineKeyframes = `
@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
`;

// Inject styles if not already injected
if (typeof document !== 'undefined' && !document.querySelector('#restart-progress-styles')) {
  const style = document.createElement('style');
  style.id = 'restart-progress-styles';
  style.textContent = shineKeyframes;
  document.head.appendChild(style);
}

interface RestartProgressBarProps {
  progress: number; // 0 to 1
  isVisible: boolean;
  isReleased?: boolean; // For fade-out animation
}

// Color interpolation utility: green to red
const interpolateColor = (progress: number): string => {
  // Clamp progress between 0 and 1
  const t = Math.max(0, Math.min(1, progress));
  
  // Start with bright green (0, 255, 0) and transition to bright red (255, 0, 0)
  const startColor = { r: 34, g: 197, b: 94 }; // emerald-500
  const endColor = { r: 239, g: 68, b: 68 }; // red-500
  
  // Interpolate each color component
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const RestartProgressBar = ({ 
  progress, 
  isVisible, 
  isReleased = false 
}: RestartProgressBarProps) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setFadeOut(false);
    } else if (isReleased && shouldRender) {
      // Start fade-out animation
      setFadeOut(true);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setFadeOut(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
      setFadeOut(false);
    }
  }, [isVisible, isReleased, shouldRender]);

  if (!shouldRender) return null;

  const progressPercentage = Math.max(0, Math.min(100, progress * 100));
  const fillColor = interpolateColor(progress);

  // Debug logging for visual issues
  console.log(`📊 RestartProgressBar render: progress=${progress.toFixed(3)}, percentage=${progressPercentage.toFixed(1)}%, visible=${isVisible}, released=${isReleased}`);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '300px',
        height: '14px',
        backgroundColor: 'rgba(120, 120, 120, 0.2)',
        borderRadius: '7px',
        overflow: 'hidden',
        margin: '16px auto 8px auto',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'scaleY(0.5)' : 'scaleY(1)',
        transition: fadeOut ? 'all 0.3s ease-out' : 'opacity 0.1s ease-in',
        position: 'relative',
        border: '2px solid rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Progress fill */}
      <div
        style={{
          height: '100%',
          width: `${progressPercentage}%`,
          backgroundColor: fillColor,
          borderRadius: '5px',
          transition: fadeOut ? 'none' : 'background-color 0.2s ease',
          boxShadow: progressPercentage > 3 ? `0 0 16px ${fillColor}60` : 'none',
          position: 'relative',
          overflow: 'hidden',
          minWidth: progressPercentage > 0 ? '4px' : '0px', // Ensure visibility even at low percentages
        }}
      >
        {/* Animated shine effect */}
        {progressPercentage > 2 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-30px',
              width: '30px',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
              animation: 'shine 1.5s infinite linear',
              borderRadius: '5px',
            }}
          />
        )}
      </div>
      
      {/* Subtle inner highlight */}
      <div
        style={{
          position: 'absolute',
          top: '1px',
          left: '1px',
          right: '1px',
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0))',
          borderRadius: '4px 4px 0 0',
          pointerEvents: 'none',
        }}
      />
      
      {/* Progress text indicator */}
      {progress > 0.1 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: progressPercentage > 30 ? 'white' : '#333',
            textShadow: progressPercentage > 30 ? '0 1px 2px rgba(0, 0, 0, 0.8)' : 'none',
            pointerEvents: 'none',
            opacity: fadeOut ? 0 : 0.9,
            whiteSpace: 'nowrap',
          }}
        >
          {Math.round(progressPercentage)}%
        </div>
      )}
    </div>
  );
};