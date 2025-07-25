import { useState, useEffect } from 'react';
import { Button } from './Button';
import { THEME_COLORS } from '../constants/colors';

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
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
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
            <Button
              variant="secondary"
              size="medium"
              type="button"
              onClick={onCancel}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              size="medium"
              type="submit"
            >
              Save Score
            </Button>
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