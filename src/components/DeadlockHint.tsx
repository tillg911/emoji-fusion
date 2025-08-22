import { DESIGN_TOKENS } from '../constants/design-system';

interface DeadlockHintProps {
  message: string | null;
  gridWidth: number;
}

export const DeadlockHint = ({ message, gridWidth }: DeadlockHintProps) => {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px', // Below PowerUpHint if both are shown
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: `${Math.max(gridWidth, 320)}px`,
      padding: '0 20px',
      zIndex: 99, // Just below PowerUpHint
      pointerEvents: 'none', // Allow clicks to pass through to game
      display: 'flex',
      justifyContent: 'center',
      animation: 'slideInFromTop 0.3s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        padding: DESIGN_TOKENS.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Same as PowerUpBar and PowerUpHint
        border: '2px solid rgba(0, 0, 0, 0.1)', // Same as PowerUpBar and PowerUpHint
        borderRadius: '12px', // Same as other components
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Same as PowerUpHint
        backdropFilter: 'blur(8px)', // Same as PowerUpHint
      }}>
        <div style={{
          color: '#333333', // Same dark text color as other UI elements
          fontSize: 'clamp(13px, 2.8vw, 15px)',
          fontWeight: '600',
          lineHeight: 1.3,
          textAlign: 'center',
        }}>
          ⚠️ {message}
        </div>
      </div>

      {/* CSS Animation - same as PowerUpHint */}
      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};