import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character (default: 16)
  delay?: number; // initial delay before typing starts in ms (default: 0)
  className?: string;
  cursorClassName?: string;
  showCursor?: boolean;
  allowSkipOnClick?: boolean;
  onComplete?: () => void;
  triggerKey?: string | number;
}

/**
 * TypewriterText
 * Smoothly reveals text character by character with high readability and natural cadence.
 * Allows clicking on the text to instantly skip to the end.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text = '',
  speed = 16,
  delay = 0,
  className = '',
  cursorClassName = 'inline-block w-1.5 h-3.5 bg-teal-500 rounded-xs mx-0.5 align-middle',
  showCursor = true,
  allowSkipOnClick = true,
  onComplete,
  triggerKey,
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If empty text, reset immediately
    if (!text) {
      setDisplayedLength(0);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    let currentIndex = 0;
    const totalLength = text.length;

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < totalLength) {
          currentIndex += 1;
          setDisplayedLength(currentIndex);

          // Natural cadence: slight pause on Persian sentence/clause punctuation
          const char = text[currentIndex - 1];
          let nextDelay = speed;
          if (char === '؛' || char === '،' || char === '؛') {
            nextDelay = speed * 2.2;
          } else if (char === '.' || char === '!' || char === '؟') {
            nextDelay = speed * 3.5;
          }

          timerRef.current = setTimeout(typeNextChar, nextDelay);
        } else {
          setIsTyping(false);
          if (onComplete) onComplete();
        }
      };

      timerRef.current = setTimeout(typeNextChar, speed);
    };

    const initialTimer = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, delay, triggerKey]);

  const handleSkip = () => {
    if (!allowSkipOnClick || !isTyping) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayedLength(text.length);
    setIsTyping(false);
    if (onComplete) onComplete();
  };

  const visibleText = text.slice(0, displayedLength);

  return (
    <span
      onClick={handleSkip}
      className={`${className} ${allowSkipOnClick && isTyping ? 'cursor-pointer select-text' : ''}`}
      title={allowSkipOnClick && isTyping ? 'کلیک برای نمایش فوری کل متن' : undefined}
    >
      {visibleText}
      {showCursor && isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
          className={cursorClassName}
          aria-hidden="true"
        />
      )}
    </span>
  );
};
