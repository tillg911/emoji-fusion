import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { GameButton } from './GameButton';
import { ResponsiveContainer } from './ResponsiveContainer';
import { FloatingEmojis } from './FloatingEmojis';
import { isMuted, setMuted, initSoundOnUserGesture, playButtonClick, isSoundSystemReady } from '../utils/sound';

// Safe imports with fallbacks
let DESIGN_TOKENS: any = {};
let CELL_GAP = 8;

try {
  const designTokens = require('../constants/design-system');
  DESIGN_TOKENS = designTokens.DESIGN_TOKENS || {};
} catch (error) {
  console.warn('Could not import DESIGN_TOKENS, using fallbacks');
}

try {
  const styles = require('../constants/styles');
  CELL_GAP = styles.CELL_GAP || 8;
} catch (error) {
  console.warn('Could not import CELL_GAP, using fallback');
}

interface SettingsScreenProps {
  onBackToMenu: () => void;
}

const SettingsScreen = ({ onBackToMenu }: SettingsScreenProps) => {
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize sound state on component mount
  useEffect(() => {
    const updateSoundState = () => {
      try {
        if (isSoundSystemReady()) {
          setSoundEnabled(!isMuted());
        }
      } catch (error) {
        console.warn('Error reading sound state:', error);
        setSoundEnabled(true); // Fallback
      }
    };
    
    updateSoundState();
    
    // If not ready yet, check again in a moment
    if (!isSoundSystemReady()) {
      const timer = setTimeout(updateSoundState, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSoundToggle = () => {
    try {
      // Initialize sound system if not already done
      initSoundOnUserGesture();
      
      const newSoundState = !soundEnabled;
      setSoundEnabled(newSoundState);
      setMuted(!newSoundState);
      
      // Play feedback sound if enabling sound
      if (newSoundState) {
        setTimeout(() => {
          try {
            playButtonClick();
          } catch (error) {
            console.warn('Error playing sound:', error);
          }
        }, 100);
      }
    } catch (error) {
      console.warn('Error toggling sound:', error);
    }
  };

  const handleBackToMenu = () => {
    try {
      playButtonClick();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
    onBackToMenu();
  };

  // Calculate button width based on game grid dimensions for consistency (same as StartScreen)
  const calculateGridButtonWidth = () => {
    try {
      const baseCellSize = 100;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
      
      const availableWidth = Math.max(viewportWidth - 100, 320);
      const availableHeight = Math.max(viewportHeight - 350, 280);
      
      const cellSize = Math.min(
        baseCellSize,
        Math.floor((availableWidth - (3 * CELL_GAP)) / 4),
        Math.floor((availableHeight - (3 * CELL_GAP)) / 4)
      );
      
      const minCellSize = viewportWidth < 480 ? 50 : viewportWidth < 768 ? 65 : 75;
      const actualCellSize = Math.max(cellSize, minCellSize);
      
      return (actualCellSize + CELL_GAP) * 4 - CELL_GAP;
    } catch (error) {
      console.warn('Error calculating grid button width:', error);
      return 320; // Fallback
    }
  };

  const gridButtonWidth = calculateGridButtonWidth();

  // Safe access to design tokens with fallbacks
  const fontSize = {
    '3xl': DESIGN_TOKENS.fontSize?.['3xl'] || '1.875rem',
    'base': DESIGN_TOKENS.fontSize?.base || '1rem',
    'lg': DESIGN_TOKENS.fontSize?.lg || '1.125rem',
    'sm': DESIGN_TOKENS.fontSize?.sm || '0.875rem'
  };

  const spacing = {
    lg: DESIGN_TOKENS.spacing?.lg || '24px',
    md: DESIGN_TOKENS.spacing?.md || '16px',
    sm: DESIGN_TOKENS.spacing?.sm || '8px'
  };

  const color = {
    primary: DESIGN_TOKENS.color?.primary || '#4CAF50',
    secondary: DESIGN_TOKENS.color?.secondary || '#f5f5f5'
  };

  const borderRadius = {
    lg: DESIGN_TOKENS.borderRadius?.lg || '12px'
  };

  return (
    <ResponsiveContainer>
      {/* Floating Emojis Background */}
      <FloatingEmojis 
        containerWidth={typeof window !== 'undefined' ? window.innerWidth : 800}
        containerHeight={typeof window !== 'undefined' ? window.innerHeight : 600}
        maxEmojis={15}
      />
      
      {/* Settings Title */}
      <div style={{
        fontSize: fontSize['3xl'],
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        margin: '0',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
        {t('settings.title', { defaultValue: 'Einstellungen' })}
      </div>

      {/* Settings Subtitle */}
      <div style={{
        fontSize: fontSize.base,
        color: '#666',
        textAlign: 'center',
        maxWidth: '90%',
        lineHeight: '1.5',
        margin: '0',
        position: 'relative',
        zIndex: 1,
      }}>
        {t('settings.subtitle', { defaultValue: 'Passe dein Spielerlebnis an' })}
      </div>

      {/* Settings Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        alignItems: 'center',
        width: '100%',
        maxWidth: `${gridButtonWidth}px`,
        position: 'relative',
        zIndex: 1,
      }}>
        
        {/* Sound Toggle - Main Feature */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          alignItems: 'center',
          width: '100%',
          padding: spacing.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: borderRadius.lg,
          border: `2px solid ${soundEnabled ? color.primary : '#ccc'}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            fontSize: fontSize.lg,
            fontWeight: '600',
            color: '#333',
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}>
            Audio-Einstellungen
          </div>
          
          <GameButton
            onClick={handleSoundToggle}
            variant={soundEnabled ? "primary" : "secondary"}
            style={{
              width: '100%',
              minHeight: '60px',
              fontSize: fontSize.lg,
              fontWeight: 'bold',
              backgroundColor: soundEnabled ? color.primary : color.secondary,
              color: soundEnabled ? 'white' : '#666',
              border: `2px solid ${soundEnabled ? color.primary : '#ccc'}`,
              transition: 'all 0.3s ease',
            }}
          >
            {soundEnabled 
              ? t('settings.soundOn', { defaultValue: '🔊 Sound: An' })
              : t('settings.soundOff', { defaultValue: '🔇 Sound: Aus' })
            }
          </GameButton>
          
          <div style={{
            fontSize: fontSize.sm,
            color: '#666',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            {soundEnabled 
              ? 'Alle Spielsounds sind aktiviert'
              : 'Alle Spielsounds sind deaktiviert'
            }
          </div>
        </div>

        {/* Back Button - Using same GameButton component as everywhere else */}
        <GameButton
          onClick={handleBackToMenu}
          variant="secondary"
          style={{
            width: `${gridButtonWidth}px`,
            minWidth: '280px',
            maxWidth: '500px',
          }}
        >
          🏠 {t('settings.backToMenu', { defaultValue: 'Start' })}
        </GameButton>
      </div>
    </ResponsiveContainer>
  );
};

// Default export as requested
export default SettingsScreen;