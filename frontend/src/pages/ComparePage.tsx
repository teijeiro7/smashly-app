import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiCpu, FiLayers, FiArrowRight, FiBookmark } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/seo/SEO';
import {
  organizationSchema,
  webPageSchema,
  breadcrumbSchema,
} from '../utils/seoSchemas';
import { buildUrl, allKeywords } from '../config/seo';

const Container = styled.div`
  min-height: 100dvh;
  background:
    radial-gradient(circle at top right, rgba(21, 128, 61, 0.08), transparent 42%),
    linear-gradient(150deg, #f8faf8 0%, #edf7ef 45%, #e6f4e7 100%);
  padding: 1rem 1rem calc(6.5rem + env(safe-area-inset-bottom));

  @media (min-width: 769px) {
    padding: 1.5rem 1.5rem 4rem;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  text-align: center;

  @media (max-width: 768px) {
    border-radius: 18px;
    padding: 1.25rem 1rem;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #15803d;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const HeaderActions = styled.div`
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;

  @media (max-width: 640px) {
    margin-top: 1.25rem;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  min-height: 44px;
  background: transparent;
  color: #15803d;
  border: 2px solid #16a34a;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: rgba(22, 163, 74, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(21, 128, 61, 0.15);
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding-top: 1.25rem;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 320px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: rgba(21, 128, 61, 0.3);

    .icon-container {
      background: #15803d;
      color: white;
      transform: scale(1.08);
    }

    .arrow-icon {
      transform: translateX(4px);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto auto;
    column-gap: 1.25rem;
    padding: 1.5rem;
    border-radius: 16px;
    min-height: 160px;
    text-align: left;
    align-content: center;
  }
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #f0fdf4;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    font-size: 1.75rem;
    margin-bottom: 0;
    grid-column: 1;
    grid-row: 1 / 4;
    align-self: center;
    justify-self: center;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 0.375rem;
    grid-column: 2;
    grid-row: 1;
  }
`;

const CardDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  flex-grow: 1;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    margin-bottom: 0.625rem;
    grid-column: 2;
    grid-row: 2;
  }
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #15803d;
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    grid-column: 2;
    grid-row: 3;
  }
`;

const ArrowIcon = styled(FiArrowRight)`
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0.7;
`;

const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <SEO
        title='Compara Palas de Pádel — Encuentra tu Pala Ideal'
        description='Compara palas de pádel lado a lado: peso, balance, forma, material del núcleo y precio. Encuentra la pala perfecta para tu nivel con el comparador de Smashly.'
        canonical={buildUrl('/compare')}
        keywords={allKeywords}
        type='website'
        schema={[
          organizationSchema(),
          webPageSchema({
            name: 'Comparador de Palas de Pádel — Smashly',
            description: 'Compara palas de pádel lado a lado por especificaciones, precio y opiniones.',
            url: buildUrl('/compare'),
          }),
          breadcrumbSchema([
            { name: 'Inicio', url: buildUrl('/') },
            { name: 'Comparar', url: buildUrl('/compare') },
          ]),
        ]}
      />
      <Header>
        <Title>
          Encuentra tu <span className='highlight'>Pala Ideal</span>
        </Title>
        <Subtitle>
          Utiliza nuestras herramientas avanzadas para encontrar la pala perfecta para tu estilo de
          juego o compara diferentes modelos
        </Subtitle>
        {isAuthenticated && (
          <HeaderActions>
            <SecondaryButton onClick={() => navigate('/comparisons')}>
              <FiBookmark />
              Mis Comparaciones Guardadas
            </SecondaryButton>
          </HeaderActions>
        )}
      </Header>

      <MainContent>
        <Card
          onClick={() => navigate('/best-racket')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconContainer className='icon-container'>
            <FiCpu />
          </IconContainer>
          <CardTitle>Mejor pala para ti</CardTitle>
          <CardDescription>
            Nuestro algoritmo de IA analiza tu estilo de juego, nivel y preferencias para
            recomendarte las palas que mejor se adaptan a ti.
          </CardDescription>
          <ActionButton>
            Descubrir ahora <ArrowIcon className='arrow-icon' />
          </ActionButton>
        </Card>

        <Card
          onClick={() => navigate('/compare-rackets')} // Assuming this route exists or will be created, or maybe this page IS the compare page but leads to a specific tool?
          // Wait, the user said "No hagas la seccion de palas mas vendidas, solo la de mejor pala para ti y la de compara palas".
          // If I am IN the compare page, maybe these should open modals or navigate to specific tools?
          // For now I'll assume they navigate to specific routes or sections.
          // Actually, if this IS the compare page, maybe I should implement the functionality here?
          // But the design looks like a landing for these tools.
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconContainer className='icon-container'>
            <FiLayers />
          </IconContainer>
          <CardTitle>Comparar palas</CardTitle>
          <CardDescription>
            Selecciona y compara detalladamente las características técnicas, precios y opiniones de
            hasta 3 palas simultáneamente.
          </CardDescription>
          <ActionButton>
            Empezar a comparar <ArrowIcon className='arrow-icon' />
          </ActionButton>
        </Card>
      </MainContent>
    </Container>
  );
};

export default ComparePage;
