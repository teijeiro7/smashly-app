import { motion } from "framer-motion";
import React from "react";
import { FiClock, FiHome } from "react-icons/fi";
import { Link } from '@tanstack/react-router';
import styled from "styled-components";

const Container = styled.div`
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, var(--surface-2) 0%, var(--primary-faint) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ContentCard = styled(motion.div)`
  background: var(--surface);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(var(--primary-rgb), 0.1);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 2rem;
    border-radius: 16px;
  }
`;

const IconWrapper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  border-radius: 50%;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(var(--primary-rgb), 0.3);

  svg {
    width: 60px;
    height: 60px;
    color: white;
  }

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;

    svg {
      width: 50px;
      height: 50px;
    }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 1rem;
  line-height: 1.2;

  .highlight {
    background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled(Link)<{ variant?: "primary" | "secondary" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  ${(props) =>
    props.variant === "primary"
      ? `
    background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.4);
      color: white;
      text-decoration: none;
    }
  `
      : `
    background: var(--surface);
    color: var(--primary);
    border: 2px solid var(--primary);
    
    &:hover {
      background: var(--primary-subtle);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.2);
      color: var(--primary-hover);
      text-decoration: none;
    }
  `}

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ComingSoonPage: React.FC = () => {
  return (
    <Container>
      <ContentCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <IconWrapper
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <FiClock />
        </IconWrapper>

        <Title>
          <span className="highlight">Próximamente</span> Disponible
        </Title>

        <Subtitle>
          Estamos trabajando arduamente para traerte esta funcionalidad
          increíble. ¡Pronto estará lista!
        </Subtitle>

        <ButtonGroup>
          <Button to="/" variant="primary">
            <FiHome />
            Volver al Inicio
          </Button>
          <Button to="/catalog" variant="secondary">
            Ver Catálogo
          </Button>
        </ButtonGroup>
      </ContentCard>
    </Container>
  );
};

export default ComingSoonPage;
