import { useEffect, useRef, useCallback, useState } from 'react';

interface KeyboardControlsProps {
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onUndo?: () => void;
  onRestart?: () => void;
  disabled?: boolean;
  canUndo?: boolean;
}

interface KeyPressState {
  isPressed: boolean;
  startTime: number;
  timeoutId: number | null;
}

export const useKeyboardControls = ({
  onMove,
  onUndo,
  onRestart,
  disabled = false,
  canUndo = false,
}: KeyboardControlsProps) => {
  const restartKeyState = useRef<KeyPressState>({
    isPressed: false,
    startTime: 0,
    timeoutId: null,
  });

  const [restartProgress, setRestartProgress] = useState(0);
  const [isRestartInProgress, setIsRestartInProgress] = useState(false);
  const progressInterval = useRef<number | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Prevent default behavior for game keys
      const gameKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
        'u', 'U', 'r', 'R'
      ];
      
      if (gameKeys.includes(event.key)) {
        event.preventDefault();
      }

      // Movement controls (Arrow keys)
      if (onMove) {
        switch (event.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            onMove('up');
            return;
          case 'ArrowDown':
          case 's':
          case 'S':
            onMove('down');
            return;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            onMove('left');
            return;
          case 'ArrowRight':
          case 'd':
          case 'D':
            onMove('right');
            return;
        }
      }

      // Undo control
      if ((event.key === 'u' || event.key === 'U') && onUndo && canUndo) {
        onUndo();
        return;
      }

      // Restart control (hold R for 3 seconds)
      if ((event.key === 'r' || event.key === 'R') && onRestart) {
        if (!restartKeyState.current.isPressed) {
          restartKeyState.current.isPressed = true;
          restartKeyState.current.startTime = Date.now();
          setIsRestartInProgress(true);
          setRestartProgress(0);
          
          // Start progress tracking interval
          progressInterval.current = window.setInterval(() => {
            const elapsed = Date.now() - restartKeyState.current.startTime;
            const progress = Math.min(elapsed / 3000, 1);
            setRestartProgress(progress);
          }, 50); // Update every 50ms for smooth animation
          
          // Set timeout for 3 seconds
          restartKeyState.current.timeoutId = window.setTimeout(() => {
            if (restartKeyState.current.isPressed) {
              onRestart();
              // Clean up
              restartKeyState.current.isPressed = false;
              restartKeyState.current.timeoutId = null;
              setIsRestartInProgress(false);
              setRestartProgress(0);
              if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
              }
            }
          }, 3000);
        }
        return;
      }
    },
    [disabled, onMove, onUndo, onRestart, canUndo]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Handle R key release (cancel restart if released early)
      if ((event.key === 'r' || event.key === 'R') && restartKeyState.current.isPressed) {
        restartKeyState.current.isPressed = false;
        setIsRestartInProgress(false);
        setRestartProgress(0);
        
        if (restartKeyState.current.timeoutId) {
          clearTimeout(restartKeyState.current.timeoutId);
          restartKeyState.current.timeoutId = null;
        }
        
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    },
    [disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clean up timeout and interval on unmount
      if (restartKeyState.current.timeoutId) {
        clearTimeout(restartKeyState.current.timeoutId);
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    restartProgress,
    isRestartInProgress,
  };
};