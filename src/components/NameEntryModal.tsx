import { useState, useEffect } from 'react';
import { GameButton } from './GameButton';
import { THEME_COLORS } from '../constants/colors';
import { DESIGN_TOKENS } from '../constants/design-system';

interface NameEntryModalProps {
  isVisible: boolean;
  score: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export const NameEntryModal = ({ isVisible, score, onSubmit, onCancel }: NameEntryModalProps) => {
  const [name, setName] = useState('');
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  // Handle animation visibility
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsAnimationVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimationVisible(false);
    }
  }, [isVisible]);

  // Reset name when modal opens
  useEffect(() => {
    if (isVisible) {
      setName('');
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    onSubmit(trimmedName || 'Anonymous');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 12 characters
    if (value.length <= 12) {
      setName(value);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        opacity: isAnimationVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div
        style={{
          backgroundColor: THEME_COLORS.background,
          borderRadius: DESIGN_TOKENS.borderRadius.xl,
          padding: DESIGN_TOKENS.spacing['3xl'],
          maxWidth: '400px',
          width: '90%',
          boxShadow: DESIGN_TOKENS.boxShadow.xl,
          border: `2px solid ${THEME_COLORS.border.medium}`,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              color: THEME_COLORS.textPrimary,
              fontSize: DESIGN_TOKENS.fontSize.xl,
              fontWeight: 'bold',
              margin: `0 0 ${DESIGN_TOKENS.spacing.md} 0`,
            }}
          >
            🎉 New High Score!
          </h2>
          <p
            style={{
              color: THEME_COLORS.textSecondary,
              fontSize: '18px',
              margin: '0 0 8px 0',
            }}
          >
            Score: {score.toLocaleString()}
          </p>
          <p
            style={{
              color: THEME_COLORS.textSecondary,
              fontSize: '14px',
              margin: '0',
            }}
          >
            Enter your name for the leaderboard:
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Your name (max 12 chars)"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: `2px solid ${THEME_COLORS.border.light}`,
              borderRadius: '8px',
              marginBottom: '20px',
              boxSizing: 'border-box',
              backgroundColor: THEME_COLORS.background,
              color: THEME_COLORS.textPrimary,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = THEME_COLORS.primary;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = THEME_COLORS.border.light;
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <GameButton
              variant="secondary"
              size="sm"
              fullWidth={false}
              type="button"
              onClick={onCancel}
              style={{ minWidth: '100px' }}
            >
              Skip
            </GameButton>
            <GameButton
              variant="primary"
              size="sm"
              fullWidth={false}
              type="submit"
              style={{ minWidth: '100px' }}
            >
              Save Score
            </GameButton>
          </div>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '12px',
            color: THEME_COLORS.textSecondary,
          }}
        >
          {name.length}/12 characters
        </div>
      </div>
    </div>
  );
};