import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  hasPhysicalKeyboard: boolean;
  windowWidth: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 768
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect device type based on user agent
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Detect touch capability
  const isTouchDevice = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - legacy property
    navigator.msMaxTouchPoints > 0
  );

  // Screen size breakpoints
  const isMobileWidth = windowWidth < 768;
  const isTabletWidth = windowWidth >= 768 && windowWidth < 1024;

  // Combine user agent and screen size for more accurate detection
  const isMobile = isMobileUA || (isTouchDevice && isMobileWidth);
  const isTablet = (isTouchDevice && isTabletWidth) || (!isMobileUA && isTouchDevice && isTabletWidth);
  const isDesktop = !isMobile && !isTablet;

  // Assume physical keyboard availability based on device type
  const hasPhysicalKeyboard = isDesktop || (!isTouchDevice && windowWidth >= 1024);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    hasPhysicalKeyboard,
    windowWidth,
  };
};