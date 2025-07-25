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
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '16px',
          marginTop: 0,
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '16px',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: '32px',
          marginTop: 0,
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}>
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#666',
              backgroundColor: 'transparent',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '100px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#999';
              e.currentTarget.style.color = '#333';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.color = '#666';
            }}
          >
            ❌ {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.2s ease',
              minWidth: '100px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
            }}
          >
            ✅ {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};