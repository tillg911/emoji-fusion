import { useTranslation } from 'react-i18next';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { DESIGN_TOKENS } from '../constants/design-system';

interface ControlInstructionsProps {
  style?: React.CSSProperties;
  showShortcuts?: boolean;
}

export const ControlInstructions = ({ 
  style, 
  showShortcuts = true 
}: ControlInstructionsProps) => {
  const { t } = useTranslation();
  const { hasPhysicalKeyboard, isTouchDevice } = useDeviceDetection();

  return (
    <div style={{
      fontSize: DESIGN_TOKENS.fontSize.sm,
      color: '#666',
      textAlign: 'center',
      lineHeight: '1.4',
      ...style,
    }}>
      {/* Movement instructions */}
      <div style={{ marginBottom: DESIGN_TOKENS.spacing.xs }}>
        {isTouchDevice ? t('controls.touchInstructions') : t('controls.keyboardInstructions')}
      </div>
      
      {/* Keyboard shortcuts - only show on devices with physical keyboards */}
      {hasPhysicalKeyboard && showShortcuts && (
        <div style={{
          fontSize: DESIGN_TOKENS.fontSize.xs,
          opacity: 0.8,
        }}>
          {t('controls.keyboardShortcuts')}
        </div>
      )}
    </div>
  );
};