import { Button } from './Button';

interface TopBarProps {
  onGoHome: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export const TopBar = ({ onGoHome, onUndo, canUndo }: TopBarProps) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      marginBottom: '20px',
      maxWidth: '300px',
      margin: '0 auto 20px auto',
    }}>
      <Button
        variant="secondary"
        size="medium"
        onClick={onGoHome}
      >
        🏠 Main Menu
      </Button>
      
      <Button
        variant="warning"
        size="medium"
        onClick={onUndo}
        disabled={!canUndo}
      >
        ↩️ Undo
      </Button>
    </div>
  );
};