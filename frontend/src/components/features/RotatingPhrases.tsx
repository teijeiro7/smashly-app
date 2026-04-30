import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
`;

const RotatingContainer = styled.span`
  color: #fbbf24;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  min-height: 1.4em;
  position: relative;
  contain: layout paint;

  @media (max-width: 640px) {
    font-size: 0.9em;
    white-space: normal;
    max-width: 90vw;
    min-width: 140px;
  }

  @media (max-width: 480px) {
    font-size: 0.85em;
    min-width: 120px;
  }
`;

const PhraseWrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 1.4em;
`;

const PhraseItem = styled.span<{ $key: number }>`
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  animation: ${fadeInOut} 2.5s ease-in-out infinite;
  animation-delay: ${props => props.$key * 2.5}s;
  opacity: 0;
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
    position: static;
  }
`;

interface RotatingPhrasesProps {
  phrases: string[];
}

const RotatingPhrases: React.FC<RotatingPhrasesProps> = ({ phrases }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const longestPhrase = useMemo(() => {
    return Math.max(...phrases.map(p => p.length));
  }, [phrases]);

  if (!mounted) {
    return (
      <RotatingContainer aria-live="polite">
        <PhraseWrapper style={{ minWidth: `${longestPhrase * 0.6}ch` }}>
          {phrases[0]}
        </PhraseWrapper>
      </RotatingContainer>
    );
  }

  return (
    <RotatingContainer aria-live="polite">
      <PhraseWrapper style={{ minWidth: `${longestPhrase * 0.6}ch` }}>
        {phrases.map((phrase, index) => (
          <PhraseItem key={index} $key={index}>
            {phrase}
          </PhraseItem>
        ))}
      </PhraseWrapper>
    </RotatingContainer>
  );
};

export default React.memo(RotatingPhrases);