import { useState, useEffect } from 'react';
import { GameButton } from './GameButton';
import { isTopScore } from '../utils/storage';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onNameSubmit?: (name: string) => void;
}

export const GameOverOverlay = ({ score, onRestart, onMainMenu, onNameSubmit }: GameOverOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('Player');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  
  const qualifiesForLeaderboard = isTopScore(score);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Small delay to ensure the component is mounted
    
    return () => clearTimeout(timer);
  }, []);

  const handleNameSubmit = () => {
    if (onNameSubmit && name.trim()) {
      onNameSubmit(name.trim());
      setHasSubmittedScore(true);
    }
  };

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
        borderRadius: '8px',
        color: 'white',
        fontSize: 'clamp(20px, 4vh, 24px)',
        fontWeight: 'bold',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
        padding: 'clamp(16px, 3vh, 24px)',
        boxSizing: 'border-box',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1s ease-in-out',
      }}
    >
      <div style={{ 
        marginBottom: 'clamp(16px, 3vh, 20px)',
        fontSize: 'clamp(20px, 4vh, 24px)',
      }}>
        Game Over!
      </div>
      <div style={{ 
        fontSize: 'clamp(16px, 2.5vh, 18px)', 
        marginBottom: 'clamp(20px, 4vh, 24px)', 
        opacity: 0.9,
        textAlign: 'center',
      }}>
        Final Score: {score.toLocaleString()}
      </div>

      {/* Name Input for Qualifying Scores */}
      {qualifiesForLeaderboard && !hasSubmittedScore && (
        <div style={{
          marginBottom: 'clamp(20px, 3vh, 24px)',
          width: '100%',
          maxWidth: '300px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 'clamp(14px, 2vh, 16px)',
            color: '#FFD700',
            fontWeight: 'bold',
            marginBottom: 'clamp(8px, 1.5vh, 12px)',
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
              padding: 'clamp(8px, 1.5vh, 12px)',
              fontSize: 'clamp(14px, 2vh, 16px)',
              border: '2px solid #FFD700',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              marginBottom: 'clamp(12px, 2vh, 16px)',
              outline: 'none',
            }}
          />
          <GameButton onClick={handleNameSubmit}>
            💾 Save Score
          </GameButton>
        </div>
      )}

      {qualifiesForLeaderboard && hasSubmittedScore && (
        <div style={{
          fontSize: 'clamp(14px, 2vh, 16px)',
          color: '#4CAF50',
          fontWeight: 'bold',
          marginBottom: 'clamp(20px, 3vh, 24px)',
          textAlign: 'center',
        }}>
          ✅ Score saved to leaderboard!
        </div>
      )}
      
      {/* Button Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(12px, 2vh, 20px)',
        alignItems: 'center',
        width: '100%',
        maxWidth: '320px',
      }}>
        <GameButton 
          onClick={onRestart}
          disabled={qualifiesForLeaderboard && !hasSubmittedScore}
        >
          ✅ New Game
        </GameButton>
        
        <GameButton 
          onClick={onMainMenu}
          disabled={qualifiesForLeaderboard && !hasSubmittedScore}
        >
          🏠 Main Menu
        </GameButton>
      </div>
    </div>
  );
};