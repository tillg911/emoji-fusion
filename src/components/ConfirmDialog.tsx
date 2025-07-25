import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: DESIGN_TOKENS.borderRadius.xl,
        padding: DESIGN_TOKENS.spacing['3xl'],
        boxShadow: DESIGN_TOKENS.boxShadow.xl,
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: DESIGN_TOKENS.fontSize.xl,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: DESIGN_TOKENS.spacing.lg,
          marginTop: 0,
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: DESIGN_TOKENS.fontSize.base,
          color: '#666',
          lineHeight: '1.5',
          marginBottom: DESIGN_TOKENS.spacing['3xl'],
          marginTop: 0,
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: DESIGN_TOKENS.spacing.md,
          justifyContent: 'center',
        }}>
          {/* Cancel Button */}
          <GameButton
            onClick={onCancel}
            variant="secondary"
            size="sm"
            fullWidth={false}
            style={{ minWidth: '100px' }}
          >
            ❌ {cancelText}
          </GameButton>

          {/* Confirm Button */}
          <GameButton
            onClick={onConfirm}
            variant="primary"
            size="sm"
            fullWidth={false}
            style={{ minWidth: '100px' }}
          >
            ✅ {confirmText}
          </GameButton>
        </div>
      </div>
    </div>
  );
};