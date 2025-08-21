import { useState, useEffect } from 'react';
import { isMuted, setMuted, initSoundOnUserGesture } from '../utils/sound';
import { DESIGN_TOKENS } from '../constants/design-system';

interface SoundToggleProps {
  style?: React.CSSProperties;
}

export const SoundToggle = ({ style }: SoundToggleProps) => {
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());

  // Update state when component mounts
  useEffect(() => {
    setSoundEnabled(!isMuted());
  }, []);

  const handleToggle = () => {
    // Initialize sound system on first interaction
    initSoundOnUserGesture();
    
    const newMutedState = soundEnabled; // If currently enabled, we want to mute
    setMuted(newMutedState);
    setSoundEnabled(!newMutedState);
  };

  return (
    <button
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        
        // Styling to match game buttons but smaller
        padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
        fontSize: 'clamp(12px, 2.5vw, 14px)',
        fontWeight: '600',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        
        // Colors
        backgroundColor: soundEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
        color: soundEnabled ? '#059669' : '#6B7280',
        
        // Hover effect
        transition: `all ${DESIGN_TOKENS.transition.base}`,
        
        // Override any inherited styles
        minHeight: 'auto',
        width: 'auto',
        
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = soundEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = soundEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)';
      }}
      aria-label={`Sound ${soundEnabled ? 'enabled' : 'disabled'}`}
      title={`Click to ${soundEnabled ? 'disable' : 'enable'} sound effects`}
    >
      <span style={{ fontSize: '16px' }}>
        {soundEnabled ? '🔊' : '🔇'}
      </span>
      <span>
        {soundEnabled ? 'Sound On' : 'Sound Off'}
      </span>
    </button>
  );
};