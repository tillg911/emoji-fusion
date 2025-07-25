import { useState, useRef, useCallback, useEffect } from 'react';

interface UseResetHoldOptions {
  onReset: () => void;
  duration?: number; // in milliseconds
  disabled?: boolean;
}


export const useResetHold = ({ 
  onReset, 
  duration = 1000, 
  disabled = false 
}: UseResetHoldOptions) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resetTriggeredRef = useRef(false);
  const holdSourceRef = useRef<'mouse' | 'keyboard' | null>(null);

  // Clean up animation frame
  const cleanupAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    cleanupAnimation();
    setIsHolding(false);
    setProgress(0);
    startTimeRef.current = null;
    resetTriggeredRef.current = false;
    holdSourceRef.current = null;
  }, [cleanupAnimation]);

  // Progress animation loop
  const animate = useCallback(() => {
    if (!startTimeRef.current || resetTriggeredRef.current || disabled) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - startTimeRef.current;
    const newProgress = Math.min(elapsed / duration, 1);
    
    console.log(`🔄 Hold Progress (${holdSourceRef.current}): ${Math.round(newProgress * 100)}%`);
    
    setProgress(newProgress);

    // Check if completed
    if (newProgress >= 1) {
      console.log(`🎯 HOLD COMPLETED (${holdSourceRef.current}) - Triggering reset!`);
      resetTriggeredRef.current = true;
      cleanupAnimation();
      
      // Trigger reset
      onReset();
      
      // Reset state after a short delay
      setTimeout(() => {
        resetState();
      }, 200);
    } else {
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [duration, disabled, onReset, cleanupAnimation, resetState]);

  // Start hold
  const startHold = useCallback((source: 'mouse' | 'keyboard') => {
    if (disabled || isHolding || resetTriggeredRef.current) {
      console.log(`🔴 Cannot start ${source} hold:`, { disabled, isHolding, resetTriggered: resetTriggeredRef.current });
      return;
    }
    
    console.log(`🟢 ${source} hold STARTED`);
    
    // Set state
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = performance.now();
    resetTriggeredRef.current = false;
    holdSourceRef.current = source;
    
    // Start animation
    cleanupAnimation(); // Clean up any existing animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [disabled, isHolding, animate, cleanupAnimation]);

  // Cancel hold
  const cancelHold = useCallback((source?: 'mouse' | 'keyboard') => {
    // Only cancel if no source specified, or if source matches current hold source
    if (source && holdSourceRef.current && holdSourceRef.current !== source) {
      return;
    }
    
    if (!isHolding || resetTriggeredRef.current) return;
    
    console.log(`🔴 ${holdSourceRef.current || source || 'unknown'} hold CANCELLED`);
    resetState();
  }, [isHolding, resetState]);

  // Mouse-specific functions
  const startMouseHold = useCallback(() => {
    startHold('mouse');
  }, [startHold]);

  const cancelMouseHold = useCallback(() => {
    cancelHold('mouse');
  }, [cancelHold]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || event.repeat) return; // Prevent repeat events
    
    const pressedKey = event.key.toLowerCase();
    
    if (pressedKey === 'r' && !isHolding && !resetTriggeredRef.current) {
      console.log('🔽 R-key pressed - starting hold');
      event.preventDefault();
      startHold('keyboard');
    }
  }, [disabled, isHolding, startHold]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    const releasedKey = event.key.toLowerCase();
    
    if (releasedKey === 'r' && holdSourceRef.current === 'keyboard') {
      console.log('🔼 R-key released - canceling hold');
      event.preventDefault();
      cancelHold('keyboard');
    }
  }, [disabled, cancelHold]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (disabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, disabled]);

  // Cleanup on disabled state change
  useEffect(() => {
    if (disabled && isHolding) {
      console.log('🔴 Disabled while holding, cleaning up');
      resetState();
    }
  }, [disabled, isHolding, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
  }, [cleanupAnimation]);

  return {
    isHolding,
    progress,
    startTime: startTimeRef.current,
    startMouseHold,
    cancelMouseHold,
  };
};