import { useTranslation } from 'react-i18next';
import { GameButton } from './GameButton';
import { DESIGN_TOKENS } from '../constants/design-system';
import { playButtonClick } from '../utils/sound';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  gridWidth?: number; // Width to match game grid and buttons
  confirmVariant?: 'primary' | 'warning'; // Support warning style for cautionary actions
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  gridWidth = 320,
  confirmVariant = 'primary'
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  // Sound-enhanced handlers
  const handleConfirm = () => {
    playButtonClick();
    onConfirm();
  };

  const handleCancel = () => {
    playButtonClick();
    onCancel();
  };
  
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
        padding: DESIGN_TOKENS.layout.popupPadding,
        boxShadow: DESIGN_TOKENS.boxShadow.xl,
        width: 'fit-content',
        minWidth: `${Math.max(gridWidth + 48, 328)}px`, // Add extra width for internal padding
        maxWidth: '548px', // Accommodate larger content + padding
        textAlign: 'center',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
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
          flexDirection: 'column',
          gap: DESIGN_TOKENS.spacing.md,
          alignItems: 'center',
          width: '100%',
          padding: `0 ${DESIGN_TOKENS.layout.popupContentPadding}`,
          boxSizing: 'border-box',
        }}>
          {/* Primary Action Button (Cancel - Return to name entry) */}
          <GameButton
            onClick={handleCancel}
            variant="primary"
            size="md"
            fullWidth={false}
            style={{ 
              width: `${gridWidth}px`,
              minWidth: '280px',
              maxWidth: '500px',
              minHeight: '56px',
              fontSize: DESIGN_TOKENS.fontSize.base,
              fontWeight: 'bold',
              borderRadius: DESIGN_TOKENS.borderRadius.lg,
              padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.lg}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cancelText || t('confirmDialog.cancel')}
          </GameButton>

          {/* Warning Action Button (Confirm - Skip high score) */}
          <GameButton
            onClick={handleConfirm}
            variant={confirmVariant === 'warning' ? 'warning' : 'primary'}
            size="md"
            fullWidth={false}
            style={{ 
              width: `${gridWidth}px`,
              minWidth: '280px',
              maxWidth: '500px',
              minHeight: '56px',
              fontSize: DESIGN_TOKENS.fontSize.base,
              fontWeight: 'bold',
              borderRadius: DESIGN_TOKENS.borderRadius.lg,
              padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.lg}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {confirmText || t('confirmDialog.confirm')}
          </GameButton>
        </div>
      </div>
    </div>
  );
};