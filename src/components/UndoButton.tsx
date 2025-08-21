import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { DESIGN_TOKENS } from '../constants/design-system';
import { playUndo } from '../utils/sound';

interface UndoButtonProps {
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  allowUndoWhenDisabled?: boolean;
  gridWidth: number; // Width of the game grid to match
}

export const UndoButton = ({ 
  onUndo, 
  canUndo, 
  disabled = false,
  allowUndoWhenDisabled = false,
  gridWidth
}: UndoButtonProps) => {
  const { t } = useTranslation();
  const { hasPhysicalKeyboard } = useDeviceDetection();

  // Sound-enhanced handler for undo action
  const handleUndo = () => {
    playUndo(); // Play specific undo sound
    onUndo();
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      // Remove marginTop since spacing is now handled by parent container
    }}>
      <GameButton
        variant="warning"
        size="sm"
        fullWidth={false}
        onClick={handleUndo}
        disabled={!canUndo || (disabled && !allowUndoWhenDisabled)}
        style={{ 
          width: `${gridWidth}px`,
          minWidth: '280px',
          maxWidth: '500px',
          minHeight: DESIGN_TOKENS.layout.buttonMinHeight, // Match standard button height
          padding: `clamp(${DESIGN_TOKENS.spacing.sm}, 1.5vh, ${DESIGN_TOKENS.spacing.md}) ${DESIGN_TOKENS.spacing.lg}`,
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasPhysicalKeyboard ? t('gameControls.undoShortcut') : t('gameControls.undo')}
      </GameButton>
    </div>
  );
};