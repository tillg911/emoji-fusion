import { Button } from './Button';
import { HoldToResetButton } from './HoldToResetButton';

interface GameControlsProps {
  onGoHome: () => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
  disabled?: boolean;
  allowUndoWhenDisabled?: boolean;
}

export const GameControls = ({ 
  onGoHome, 
  onUndo, 
  onReset, 
  canUndo, 
  disabled = false,
  allowUndoWhenDisabled = false
}: GameControlsProps) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 16px)', // Responsive gap
      padding: '16px 0',
      marginBottom: '20px',
      maxWidth: '100%',
      margin: '0 auto 20px auto',
      flexWrap: 'wrap', // Wrap on narrow screens
    }}>
      <Button
        variant="secondary"
        size="medium"
        onClick={onGoHome}
        disabled={disabled}
      >
        🏠 Home
      </Button>
      
      <Button
        variant="warning"
        size="medium"
        onClick={onUndo}
        disabled={!canUndo || (disabled && !allowUndoWhenDisabled)}
      >
        ↩️ Undo
      </Button>
      
      <HoldToResetButton
        onReset={onReset}
        disabled={disabled}
      />
    </div>
  );
};