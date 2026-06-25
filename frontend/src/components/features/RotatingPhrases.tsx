import React, { useEffect, useState } from 'react';
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
  color: var(--accent);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 1.2em;
  font-size: clamp(1.5rem, 5.5vw, 4rem);

  @media (max-width: 640px) {
    min-height: 2.4em;
    font-size: clamp(1.4rem, 7vw, 2.2rem);
  }

  @media (max-width: 480px) {
    min-height: 2.8em;
    font-size: clamp(1.2rem, 8vw, 1.8rem);
  }
`;

const PhraseSpan = styled.span<{ $isExiting: boolean }>`
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  animation: ${(props) => (props.$isExiting ? rotateOut : rotateIn)} ${FADE_DURATION}s ease-in-out forwards;
  will-change: transform, opacity;

  @media (max-width: 640px) {
    white-space: normal;
    word-break: break-word;
  }

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

  useEffect(() => {
    if (phrases.length <= 1) return;

    const mainInterval = setInterval(() => {
      // 1. Start exit animation
      setIsExiting(true);

      // 2. Wait for exit animation to complete, then change phrase
      const exitTimeout = setTimeout(() => {
        setDisplayIndex((prev) => (prev + 1) % phrases.length);
        setIsExiting(false);
      }, FADE_DURATION * 1000);

      return () => clearTimeout(exitTimeout);
    }, DISPLAY_DURATION);

    return () => clearInterval(mainInterval);
  }, [phrases.length]);

  return (
    <RotatingContainer aria-live="polite">
      <PhraseSpan key={displayIndex} $isExiting={isExiting}>
        {phrases[displayIndex]}
      </PhraseSpan>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);
