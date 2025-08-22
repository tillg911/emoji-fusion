import { useEffect, useRef } from 'react';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';

interface PowerUpPopupProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export const PowerUpPopup = ({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  onConfirm,
  onCancel,
  isOpen
}: PowerUpPopupProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);

  // Handle body scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusedElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the popup container
      setTimeout(() => {
        popupRef.current?.focus();
      }, 50);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to the previously focused element
      if (previousFocusedElement.current) {
        previousFocusedElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onCancel) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  // Handle click outside popup to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && onCancel) {
      onCancel();
    }
  };

  // Focus trap within popup
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = popupRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: DESIGN_TOKENS.layout.popupPadding,
        boxSizing: 'border-box',
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="popup-title"
      aria-describedby="popup-description"
    >
      <div
        ref={popupRef}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#333333',
          borderRadius: DESIGN_TOKENS.borderRadius.xl,
          padding: DESIGN_TOKENS.layout.popupContentPadding,
          width: 'min(90%, 400px)',
          maxWidth: '400px',
          boxShadow: DESIGN_TOKENS.boxShadow.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: DESIGN_TOKENS.spacing.lg,
          textAlign: 'center',
          border: '2px solid rgba(76, 175, 80, 0.2)',
          animation: 'popupFadeIn 0.15s ease-out',
          outline: 'none',
        }}
      >
        {/* Title */}
        <h2
          id="popup-title"
          style={{
            margin: 0,
            fontSize: DESIGN_TOKENS.fontSize.xl,
            fontWeight: 'bold',
            color: '#333333',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          id="popup-description"
          style={{
            margin: 0,
            fontSize: DESIGN_TOKENS.fontSize.base,
            color: '#666666',
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: DESIGN_TOKENS.spacing.md,
            flexWrap: 'wrap',
            marginTop: DESIGN_TOKENS.spacing.sm,
          }}
        >
          {/* Cancel Button */}
          <GameButton
            variant="secondary"
            size="md"
            fullWidth={false}
            onClick={onCancel}
            style={{
              minWidth: '120px',
              flex: '1',
              maxWidth: '160px',
            }}
          >
            {cancelLabel}
          </GameButton>

          {/* Confirm Button (optional) */}
          {confirmLabel && onConfirm && (
            <GameButton
              variant="primary"
              size="md"
              fullWidth={false}
              onClick={onConfirm}
              style={{
                minWidth: '120px',
                flex: '1',
                maxWidth: '160px',
              }}
            >
              {confirmLabel}
            </GameButton>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};