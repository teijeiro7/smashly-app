import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styled from 'styled-components';
import { racketImageUrl } from '../../utils/imageUrl';

interface RacketImageDeckProps {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onOverflow: () => void;
  alt: string;
}

const MAX_VISIBLE = 5;

const Deck = styled.div`
  position: relative;
  width: 100%;
  max-width: min(420px, 100%);
  height: 130px;
  margin-top: 1rem;
`;

const Card = styled(motion.button)<{ $isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: min(110px, 18%);
  aspect-ratio: 3 / 4;
  padding: 0;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  border: 2px solid ${props => (props.$isActive ? 'var(--color-primary)' : 'var(--border)')};
  box-shadow: var(--shadow-md);
  cursor: pointer;
  overflow: hidden;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.4rem;
`;

const OverflowBadge = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
`;

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.src = '/placeholder-racket.svg';
};

const RacketImageDeck: React.FC<RacketImageDeckProps> = ({
  images,
  activeIndex,
  onSelect,
  onOverflow,
  alt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const open = prefersReducedMotion || isOpen;

  if (images.length <= 1) return null;

  const visible = images.slice(0, MAX_VISIBLE);
  const overflowCount = images.length - MAX_VISIBLE;
  const center = Math.floor(visible.length / 2);

  const handleCardClick = (index: number, isLast: boolean) => {
    setIsOpen(true);
    if (isLast && overflowCount > 0) {
      onOverflow();
      return;
    }
    onSelect(index);
  };

  return (
    <Deck
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {visible.map((img, index) => {
        const dist = index - center;
        const isLast = index === visible.length - 1;
        const isActive = index === activeIndex;

        return (
          <Card
            key={index}
            type='button'
            $isActive={isActive}
            aria-label={`Ver imagen ${index + 1}`}
            aria-pressed={isActive}
            animate={{
              x: open ? `${dist * 92}%` : 0,
              scale: open && isActive ? 1.06 : 1,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 180, damping: 20, mass: 0.8 }
            }
            style={{ zIndex: isActive ? visible.length + 1 : visible.length - Math.abs(dist) }}
            onClick={() => handleCardClick(index, isLast)}
          >
            <CardImage
              src={racketImageUrl(img)}
              alt={`${alt} - imagen ${index + 1}`}
              onError={handleImageError}
              loading='lazy'
            />
            {isLast && overflowCount > 0 && <OverflowBadge>+{overflowCount}</OverflowBadge>}
          </Card>
        );
      })}
    </Deck>
  );
};

export default RacketImageDeck;
