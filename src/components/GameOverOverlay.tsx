import { useState, useEffect } from 'react';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onNameSubmit?: (name: string) => void;
  isCheckingScore?: boolean;
  isSavingScore?: boolean;
  qualifiesForLeaderboard?: boolean;
}

export const GameOverOverlay = ({ 
  score, 
  onRestart, 
  onMainMenu, 
  onNameSubmit,
  isCheckingScore = false,
  isSavingScore = false,
  qualifiesForLeaderboard = false
}: GameOverOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('Player');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Small delay to ensure the component is mounted
    
    return () => clearTimeout(timer);
  }, []);

  const handleNameSubmit = () => {
    if (onNameSubmit && name.trim() && !isSavingScore) {
      onNameSubmit(name.trim());
      setHasSubmittedScore(true);
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

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: DESIGN_TOKENS.borderRadius.lg,
        color: 'white',
        fontSize: DESIGN_TOKENS.fontSize.xl,
        fontWeight: 'bold',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
        padding: `clamp(${DESIGN_TOKENS.spacing.lg}, 3vh, ${DESIGN_TOKENS.spacing['2xl']})`,
        boxSizing: 'border-box',
        opacity: isVisible ? 1 : 0,
        transition: `opacity 1s ease-in-out`,
      }}
    >
      <div style={{ 
        marginBottom: DESIGN_TOKENS.spacing.xl,
        fontSize: DESIGN_TOKENS.fontSize.xl,
      }}>
        Game Over!
      </div>
      <div style={{ 
        fontSize: DESIGN_TOKENS.fontSize.base, 
        marginBottom: DESIGN_TOKENS.spacing['2xl'], 
        opacity: 0.9,
        textAlign: 'center',
      }}>
        Final Score: {score.toLocaleString()}
      </div>

      {/* Loading state while checking score */}
      {isCheckingScore && (
        <div style={{
          marginBottom: DESIGN_TOKENS.spacing['2xl'],
          textAlign: 'center',
          color: '#FFD700',
        }}>
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.base,
            fontWeight: 'bold',
          }}>
            ⏳ Checking leaderboard...
          </div>
        </div>
      )}
      
      {/* Loading state while saving score */}
      {isSavingScore && (
        <div style={{
          marginBottom: DESIGN_TOKENS.spacing['2xl'],
          textAlign: 'center',
          color: '#FFD700',
        }}>
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.base,
            fontWeight: 'bold',
          }}>
            💾 Saving score...
          </div>
        </div>
      )}

      {/* Name Input for Qualifying Scores */}
      {!isCheckingScore && !isSavingScore && qualifiesForLeaderboard && !hasSubmittedScore && (
        <div style={{
          marginBottom: DESIGN_TOKENS.spacing['2xl'],
          width: '100%',
          maxWidth: '300px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.sm,
            color: '#FFD700',
            fontWeight: 'bold',
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}>
            🎉 Top 10 Score! Enter your name:
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyPress={handleKeyPress}
            placeholder="Enter name (max 12 chars)"
            autoFocus
            style={{
              width: '100%',
              padding: DESIGN_TOKENS.spacing.md,
              fontSize: DESIGN_TOKENS.fontSize.sm,
              border: '2px solid #FFD700',
              borderRadius: DESIGN_TOKENS.borderRadius.lg,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              marginBottom: DESIGN_TOKENS.spacing.lg,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <GameButton 
            onClick={handleNameSubmit}
            variant="primary"
            size="sm"
            disabled={isSavingScore || !name.trim()}
          >
            {isSavingScore ? '⏳ Saving...' : '💾 Save Score'}
          </GameButton>
        </div>
      )}

      {qualifiesForLeaderboard && hasSubmittedScore && (
        <div style={{
          fontSize: DESIGN_TOKENS.fontSize.sm,
          color: '#4CAF50',
          fontWeight: 'bold',
          marginBottom: DESIGN_TOKENS.spacing['2xl'],
          textAlign: 'center',
        }}>
          ✅ Score saved to leaderboard!
        </div>
      )}
      
      {/* Button Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: DESIGN_TOKENS.spacing.lg,
        alignItems: 'center',
        width: '100%',
        maxWidth: DESIGN_TOKENS.layout.buttonMaxWidth,
      }}>
        <GameButton 
          onClick={onRestart}
          disabled={isCheckingScore || isSavingScore || (qualifiesForLeaderboard && !hasSubmittedScore)}
          variant="primary"
        >
          {isCheckingScore || isSavingScore ? '⏳ Please wait...' : '✅ New Game'}
        </GameButton>
        
        <GameButton 
          onClick={onMainMenu}
          disabled={isCheckingScore || isSavingScore || (qualifiesForLeaderboard && !hasSubmittedScore)}
          variant="secondary"
        >
          {isCheckingScore || isSavingScore ? '⏳ Please wait...' : '🏠 Main Menu'}
        </GameButton>
      </div>
    </div>
  );
};