import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const FADE_DURATION = 0.35;
const DISPLAY_DURATION = 2500;

const rotateIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const rotateOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-12px);
  }
`;

const RotatingContainer = styled.div`
  color: #fbbf24;
  display: block;
  width: 100%;
  text-align: center;
  min-height: 1.4em;
  white-space: nowrap;
  overflow-wrap: break-word;
  hyphens: auto;

  @media (max-width: 640px) {
    font-size: 0.9em;
    min-height: 2.8em;
    white-space: normal;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
    min-height: 3.2em;
    white-space: normal;
  }
`;

const PhraseSpan = styled.span<{ $isExiting: boolean }>`
  display: block;
  animation: ${(props) => (props.$isExiting ? rotateOut : rotateIn)} ${FADE_DURATION}s ease-in-out;
  will-change: transform, opacity;
  word-break: break-word;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
    transform: none;
  }
`;

interface RotatingPhrasesProps {
  phrases: string[];
}

const RotatingPhrases: React.FC<RotatingPhrasesProps> = ({ phrases }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const advance = useCallback(() => {
    setIsExiting(true);
    timeoutRef.current = setTimeout(() => {
      setDisplayIndex((prev) => (prev + 1) % phrases.length);
      setIsExiting(false);
    }, FADE_DURATION * 1000);
  }, [phrases.length]);

  useEffect(() => {
    intervalRef.current = setInterval(advance, DISPLAY_DURATION);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [advance]);

  return (
    <RotatingContainer aria-live="polite">
      <PhraseSpan $isExiting={isExiting}>
        {phrases[displayIndex]}
      </PhraseSpan>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);
