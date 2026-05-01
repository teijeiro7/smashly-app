import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

const FADE_DURATION = 0.35;
const DISPLAY_DURATION = 2500;

const RotatingContainer = styled.div`
  color: #fbbf24;
  display: block;
  width: 100%;
  text-align: center;
  min-height: 1.4em;
  white-space: nowrap;

  @media (max-width: 640px) {
    font-size: 0.9em;
    min-height: 1.3em;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
    min-height: 1.2em;
  }
`;

interface RotatingPhrasesProps {
  phrases: string[];
}

const RotatingPhrases: React.FC<RotatingPhrasesProps> = ({ phrases }) => {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % phrases.length);
  }, [phrases.length]);

  useEffect(() => {
    intervalRef.current = setInterval(advance, DISPLAY_DURATION);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <RotatingContainer aria-live="polite">
        <span>{phrases[0]}</span>
      </RotatingContainer>
    );
  }

  return (
    <RotatingContainer aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: FADE_DURATION, ease: 'easeInOut' }}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {phrases[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);
