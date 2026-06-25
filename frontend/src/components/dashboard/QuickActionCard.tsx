import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

const Card = styled(motion.div)`
  background: var(--surface);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid rgba(var(--primary-rgb), 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(var(--primary-rgb), 0.15);
    border-color: var(--primary);

    .icon-container {
      background: var(--brand-surface);
      color: var(--brand-on-surface);
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem 1rem;
    gap: 0.625rem;
    border-radius: 16px;
  }
`;

const IconContainer = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: var(--primary-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    font-size: 1.25rem;
  }
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    line-height: 1.3;
  }
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    display: none;
  }
`;

interface QuickActionCardProps {
  icon: IconType;
  title: string;
  description: string;
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <IconContainer className="icon-container">
        <Icon />
      </IconContainer>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};
