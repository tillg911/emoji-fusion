import { GameButton } from './GameButton';
import { HoldToResetButton } from './HoldToResetButton';
import { DESIGN_TOKENS } from '../constants/design-system';

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
      gap: DESIGN_TOKENS.spacing.md,
      padding: `${DESIGN_TOKENS.spacing.lg} 0`,
      marginBottom: DESIGN_TOKENS.spacing.xl,
      maxWidth: '100%',
      margin: `0 auto ${DESIGN_TOKENS.spacing.xl} auto`,
      flexWrap: 'wrap',
    }}>
      <GameButton
        variant="secondary"
        size="sm"
        fullWidth={false}
        onClick={onGoHome}
        disabled={disabled}
        style={{ minWidth: 'clamp(80px, 15vw, 120px)' }}
      >
        🏠 Home
      </GameButton>
      
      <GameButton
        variant="warning"
        size="sm"
        fullWidth={false}
        onClick={onUndo}
        disabled={!canUndo || (disabled && !allowUndoWhenDisabled)}
        style={{ minWidth: 'clamp(80px, 15vw, 120px)' }}
      >
        ↩️ Undo
      </GameButton>
      
      <HoldToResetButton
        onReset={onReset}
        disabled={disabled}
      />
    </div>
  );
};