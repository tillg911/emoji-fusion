import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';

interface HomeButtonProps {
  onGoHome: () => void;
  disabled?: boolean;
  gridWidth: number; // Width of the game grid to match
}

export const HomeButton = ({ onGoHome, disabled = false, gridWidth }: HomeButtonProps) => {
  const { t } = useTranslation();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: DESIGN_TOKENS.spacing.lg,
      width: '100%',
    }}>
      <GameButton
        variant="secondary"
        size="sm"
        fullWidth={false}
        onClick={onGoHome}
        disabled={disabled}
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
        {t('gameControls.home')}
      </GameButton>
    </div>
  );
};