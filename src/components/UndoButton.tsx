import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { DESIGN_TOKENS } from '../constants/design-system';

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
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: DESIGN_TOKENS.spacing.lg,
      width: '100%',
    }}>
      <GameButton
        variant="warning"
        size="md"
        fullWidth={false}
        onClick={onUndo}
        disabled={!canUndo || (disabled && !allowUndoWhenDisabled)}
        style={{ 
          width: `${gridWidth}px`,
          minWidth: '280px',
          maxWidth: '500px',
          padding: `clamp(${DESIGN_TOKENS.spacing.md}, 2vh, ${DESIGN_TOKENS.spacing.lg}) ${DESIGN_TOKENS.spacing.lg}`,
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          fontWeight: 'bold',
          minHeight: DESIGN_TOKENS.layout.buttonMinHeight, // Match standard button height
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