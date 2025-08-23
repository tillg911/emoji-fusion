import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';
import { playButtonClick, playNewGame, playTop100 } from '../utils/sound';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onBackToGame?: () => void;
  canUndo?: boolean;
  extraUndos?: number;
  onNameSubmit?: (name: string) => void;
  onSkipHighScore?: () => void;
  isCheckingScore?: boolean;
  isSavingScore?: boolean;
  qualifiesForLeaderboard?: boolean;
  gridWidth: number; // Width of the game grid to match all elements
}

export const GameOverOverlay = ({ 
  score, 
  onRestart, 
  onMainMenu, 
  onBackToGame,
  canUndo = false,
  extraUndos = 0,
  onNameSubmit,
  onSkipHighScore,
  isCheckingScore = false,
  isSavingScore = false,
  qualifiesForLeaderboard = false,
  gridWidth
}: GameOverOverlayProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState(t('common.player'));
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Consistent styling for all interactive elements - matches game grid width
  const consistentElementStyle = {
    width: `${gridWidth}px`,
    minWidth: '280px',
    maxWidth: '500px',
    minHeight: '56px',
    fontSize: DESIGN_TOKENS.fontSize.base,
    fontWeight: 'bold',
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.lg}`,
    boxSizing: 'border-box' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Small delay to ensure the component is mounted
    
    return () => clearTimeout(timer);
  }, []);

  // Debug back to game availability
  useEffect(() => {
    console.log('🔍 GameOverOverlay back to game debug:', {
      canUndo,
      extraUndos,
      onBackToGame: !!onBackToGame
    });
  }, [canUndo, extraUndos, onBackToGame]);

  const handleNameSubmit = () => {
    if (onNameSubmit && name.trim() && !isSavingScore) {
      playTop100(); // Play celebration sound for high score submission
      setHasSubmittedScore(true); // Mark immediately to prevent double submission
      onNameSubmit(name.trim());
    }
  };
  
  // Reset hasSubmittedScore when isSavingScore changes from true to false with error
  useEffect(() => {
    if (!isSavingScore && hasSubmittedScore) {
      // If saving is done but we haven't left the screen, there might have been an error
      // Keep hasSubmittedScore true to show the success message
    }
  }, [isSavingScore, hasSubmittedScore]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && qualifiesForLeaderboard && !hasSubmittedScore) {
      handleNameSubmit();
    }
  };

  const handleRestartClick = () => {
    if (qualifiesForLeaderboard && !hasSubmittedScore && !isSavingScore) {
      playButtonClick(); // Sound for showing confirmation dialog
      setShowSkipConfirm(true);
    } else {
      playNewGame(); // Sound for starting new game
      onRestart();
    }
  };

  const handleMainMenuClick = () => {
    // Always go to main menu without confirmation
    // Pending high score will be handled on the Start Screen
    playButtonClick();
    onMainMenu();
  };

  const handleSkipConfirm = () => {
    playNewGame(); // Sound for confirming skip and starting new game
    setShowSkipConfirm(false);
    setHasSubmittedScore(true); // Mark as submitted to prevent further prompts
    if (onSkipHighScore) {
      onSkipHighScore();
    }
    // Only restart for the restart button, not main menu
    onRestart();
  };

  const handleSkipCancel = () => {
    playButtonClick(); // Sound for canceling skip confirmation
    setShowSkipConfirm(false);
    // User cancels - they can still interact with the Game Over screen normally
    // Focus back on the name input if it exists
    setTimeout(() => {
      const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (nameInput && qualifiesForLeaderboard && !hasSubmittedScore) {
        nameInput.focus();
      }
    }, 100);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // Changed to flex-start to prevent overlap
        color: 'white',
        fontSize: DESIGN_TOKENS.fontSize.xl,
        fontWeight: 'bold',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
        padding: `clamp(${DESIGN_TOKENS.spacing.lg}, 4vh, ${DESIGN_TOKENS.spacing['3xl']}) clamp(${DESIGN_TOKENS.spacing.md}, 3vw, ${DESIGN_TOKENS.spacing['2xl']})`,
        paddingBottom: showSkipConfirm 
          ? 'clamp(140px, 25vh, 200px)' // More space when nested popup is shown (increased for better mobile support)
          : 'clamp(80px, 15vh, 120px)', // Reserve space for Undo button
        boxSizing: 'border-box',
        opacity: isVisible ? 1 : 0,
        transition: `opacity 1s ease-in-out`,
        overflow: showSkipConfirm ? 'hidden' : 'auto', // Prevent scrolling when nested popup is shown to avoid layout issues
      }}
    >
      {/* Game Over Content Container - Matches grid width with extra space for nested popups */}
      <div style={{
        width: 'fit-content',
        minWidth: `${gridWidth}px`,
        maxWidth: `max(${gridWidth}px, min(90vw, 500px))`,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: DESIGN_TOKENS.borderRadius.xl,
        padding: showSkipConfirm 
          ? `clamp(${DESIGN_TOKENS.spacing['3xl']}, 8vh, ${DESIGN_TOKENS.spacing['4xl']})` // Extra padding when nested popup is shown
          : `clamp(${DESIGN_TOKENS.spacing.xl}, 5vh, ${DESIGN_TOKENS.spacing['4xl']})`,
        border: '2px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `clamp(${DESIGN_TOKENS.spacing.md}, 2vh, ${DESIGN_TOKENS.spacing.lg})`, // Uniform spacing between all elements
        marginTop: showSkipConfirm 
          ? 'clamp(10px, 4vh, 30px)' // Reduced top margin when nested popup is shown to prevent overflow
          : 'clamp(20px, 8vh, 60px)', // Dynamic top margin to center content
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        minHeight: showSkipConfirm ? 'auto' : undefined, // Allow natural height expansion for nested popups
        maxHeight: showSkipConfirm 
          ? 'calc(100vh - 200px)' // Constrain height when nested popup is shown to prevent overflow
          : 'calc(100vh - 140px)', // Normal constraint
      }}
    >
      <div style={{ 
        fontSize: `clamp(${DESIGN_TOKENS.fontSize.lg}, 4vw, ${DESIGN_TOKENS.fontSize.xl})`,
        textAlign: 'center',
        margin: 0,
      }}>
{t('gameOver.title')}
      </div>
      <div style={{ 
        fontSize: `clamp(${DESIGN_TOKENS.fontSize.sm}, 3vw, ${DESIGN_TOKENS.fontSize.base})`, 
        opacity: 0.9,
        textAlign: 'center',
        margin: 0,
      }}>
{t('gameOver.finalScore', { score: score.toLocaleString() })}
      </div>

      {/* Loading state while checking score */}
      {isCheckingScore && (
        <div style={{
          textAlign: 'center',
          color: '#FFD700',
          fontSize: DESIGN_TOKENS.fontSize.base,
          fontWeight: 'bold',
        }}>
{t('gameOver.checkingLeaderboard')}
        </div>
      )}
      
      {/* Loading state while saving score */}
      {isSavingScore && (
        <div style={{
          textAlign: 'center',
          color: '#FFD700',
          fontSize: DESIGN_TOKENS.fontSize.base,
          fontWeight: 'bold',
        }}>
{t('gameOver.savingScore')}
        </div>
      )}

      {/* Name Input for Qualifying Scores */}
      {!isCheckingScore && !isSavingScore && qualifiesForLeaderboard && !hasSubmittedScore && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `clamp(${DESIGN_TOKENS.spacing.sm}, 2vh, ${DESIGN_TOKENS.spacing.md})`,
        }}>
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.sm,
            color: '#FFD700',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
{t('gameOver.topScore')}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyPress={handleKeyPress}
            placeholder={t('gameOver.enterName')}
            autoFocus
            style={{
              ...consistentElementStyle,
              border: '2px solid #FFD700',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              outline: 'none',
            }}
          />
          <GameButton 
            onClick={handleNameSubmit}
            variant="primary"
            size="md"
            disabled={isSavingScore || !name.trim()}
            style={consistentElementStyle}
          >
{isSavingScore ? t('gameOver.saving') : t('gameOver.saveScore')}
          </GameButton>
        </div>
      )}

      {qualifiesForLeaderboard && hasSubmittedScore && (
        <div style={{
          fontSize: DESIGN_TOKENS.fontSize.base,
          color: '#4CAF50',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
{t('gameOver.scoreSaved')}
        </div>
      )}
      
      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div style={{
          textAlign: 'center',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          padding: DESIGN_TOKENS.layout.popupPadding,
          borderRadius: DESIGN_TOKENS.borderRadius.lg,
          border: '2px solid rgba(255, 215, 0, 0.4)',
          width: `${gridWidth}px`, // Match exactly the outer container width
          minWidth: '280px',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: DESIGN_TOKENS.spacing.lg,
          boxSizing: 'border-box',
          margin: `${DESIGN_TOKENS.spacing['2xl']} 0 ${DESIGN_TOKENS.spacing['3xl']} 0`, // Extra bottom margin to prevent touching
          position: 'relative', // Ensure proper stacking context
          zIndex: 1, // Ensure it's above other content
          opacity: 1,
          transition: 'opacity 0.3s ease-in-out', // Smooth appearance
        }}>
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.base,
            color: '#FFD700',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {t('gameOver.skipHighScore')}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
            width: '100%',
            padding: `0 ${DESIGN_TOKENS.layout.popupContentPadding}`,
            boxSizing: 'border-box',
          }}>
            {/* Primary Action - Return to name entry */}
            <GameButton 
              onClick={handleSkipCancel}
              variant="primary"
              size="md"
              style={{
                ...consistentElementStyle,
                width: `calc(${gridWidth}px - ${DESIGN_TOKENS.layout.popupContentPadding} * 2)`, // Account for container padding
              }}
            >
              {t('gameOver.skipCancel')}
            </GameButton>
            
            {/* Warning Action - Skip high score */}
            <GameButton 
              onClick={handleSkipConfirm}
              variant="warning"
              size="md"
              style={{
                ...consistentElementStyle,
                width: `calc(${gridWidth}px - ${DESIGN_TOKENS.layout.popupContentPadding} * 2)`, // Account for container padding
              }}
            >
              {t('gameOver.skipConfirm')}
            </GameButton>
          </div>
        </div>
      )}

      {/* Button Container - Always active now */}
      {!showSkipConfirm && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: DESIGN_TOKENS.spacing.md,
          alignItems: 'center',
          width: '100%',
        }}>
          {/* Back to Game Button - Prominently placed at top */}
          {(canUndo || extraUndos > 0) && onBackToGame && (
            <GameButton 
              onClick={() => {
                playButtonClick();
                onBackToGame();
              }}
              disabled={false} // Never disable if shown
              variant="warning"
              size="md"
              style={{
                ...consistentElementStyle,
                backgroundColor: '#FBB040',
                color: 'white',
                border: '2px solid #F59E0B',
              }}
            >
              ↩️ {t('gameOver.backToGame')}
            </GameButton>
          )}
          
          <GameButton 
            onClick={handleRestartClick}
            disabled={isCheckingScore || isSavingScore}
            variant="primary"
            size="md"
            style={consistentElementStyle}
          >
            {isCheckingScore || isSavingScore ? t('gameOver.pleaseWait') : t('gameOver.newGame')}
          </GameButton>
          
          <GameButton 
            onClick={handleMainMenuClick}
            disabled={isCheckingScore || isSavingScore}
            variant="secondary"
            size="md"
            style={consistentElementStyle}
          >
            {isCheckingScore || isSavingScore ? t('gameOver.pleaseWait') : t('gameOver.mainMenu')}
          </GameButton>
        </div>
      )}
      </div>
    </div>
  );
};