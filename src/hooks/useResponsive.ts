import { useState, useEffect } from 'react';

export type ScreenBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: ScreenBreakpoint;
  isMobile: boolean;      // < 768px
  isSmallMobile: boolean; // < 480px
  isTablet: boolean;      // 768px - 1023px
  isDesktop: boolean;     // 1024px - 1535px
  isUltrawide: boolean;   // >= 1536px
  isLandscape: boolean;
  isPortrait: boolean;
  isTouch: boolean;
}

function getBreakpoint(width: number): ScreenBreakpoint {
  if (width < 480) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1200, height: 800 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      // Debounce slightly to maintain optimal UI fluidity
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial sync
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const { width, height } = dimensions;
  const breakpoint = getBreakpoint(width);
  const isLandscape = width > height;

  return {
    width,
    height,
    breakpoint,
    isMobile: width < 768,
    isSmallMobile: width < 480,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024 && width < 1536,
    isUltrawide: width >= 1536,
    isLandscape,
    isPortrait: !isLandscape,
    isTouch,
  };
}
