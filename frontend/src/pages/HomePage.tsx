import React, { useEffect } from 'react';
import { FiDatabase, FiDollarSign, FiSearch, FiTarget, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import AiBanner from '../components/features/AiBanner';
import RotatingPhrases from '../components/features/RotatingPhrases';
import { useAuth } from '../contexts/AuthContext';
import { useInView } from '../hooks/useInView';

const heroFadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100dvh;
  background: linear-gradient(135deg, #f8faf8 0%, #ffffff 100%);
`;

const HeroSection = styled.section`
  padding: clamp(60px, 10vw, 100px) 20px;
  text-align: center;
  background: linear-gradient(145deg, #14532d 0%, #166534 45%, #15803d 100%);
  color: white;
  position: relative;
  overflow: hidden;
  will-change: transform, opacity;
  transform: translateZ(0);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: clamp(0.75rem, 2vw, 14px);
  margin-bottom: clamp(16px, 4vw, 24px);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform, opacity;
  animation: ${heroFadeIn} 0.6s ease forwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 768px) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Title = styled.h1`
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 800;
  margin-bottom: clamp(16px, 4vw, 24px);
  line-height: 1.2;
  text-align: center;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  animation: ${heroFadeIn} 0.8s ease forwards;
  animation-delay: 0.2s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const TitleStaticBefore = styled.span`
  display: block;
  white-space: nowrap;

  @media (max-width: 600px) {
    white-space: normal;
  }
`;

const Subtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  margin-bottom: clamp(24px, 5vw, 40px);
  opacity: 0.95;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
  animation: ${heroFadeIn} 0.8s ease forwards;
  animation-delay: 0.4s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 20px;
  animation: ${heroFadeIn} 0.8s ease forwards;
  animation-delay: 0.6s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    max-width: 360px;
    margin: 0 auto;
  }
`;

const PrimaryButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  color: #16a34a;
  min-height: 52px;
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 32px);
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    text-decoration: none;
    color: #15803d;
  }
`;

const SecondaryButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  background: transparent;
  color: white;
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 32px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    color: white;
  }
`;

const FeaturesSection = styled.section`
  padding: clamp(48px, 8vw, 80px) 20px;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 16px;
  color: #1f2937;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #6b7280;
  margin-bottom: clamp(40px, 8vw, 64px);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(20px, 4vw, 32px);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div<{ $inView: boolean }>`
  background: white;
  padding: clamp(24px, 4vw, 32px);
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  opacity: ${(props) => (props.$inView ? 1 : 0)};
  transform: ${(props) => (props.$inView ? 'translateY(0)' : 'translateY(20px)')};
  transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
  transition-delay: var(--delay, 0s);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    opacity: 1;
    transform: none;
  }

  &:hover {
    transform: ${(props) => (props.$inView ? 'translateY(-8px)' : 'translateY(20px)')};
    box-shadow: ${(props) => (props.$inView ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.05)')};
  }
`;

const FeatureIcon = styled.div`
  width: clamp(48px, 10vw, 64px);
  height: clamp(48px, 10vw, 64px);
  background: linear-gradient(135deg, #16a34a, #22c55e);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: clamp(18px, 4vw, 24px);
`;

const FeatureTitle = styled.h3`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
`;

const StatsSection = styled.section`
  background: #f8faf8;
  padding: clamp(40px, 8vw, 60px) 20px;
`;

const StatsGrid = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: clamp(20px, 5vw, 32px);
  text-align: center;
`;

const StatItem = styled.div`
  h3 {
    font-size: clamp(2rem, 5vw, 2.5rem);
    font-weight: 800;
    color: #16a34a;
    margin-bottom: 8px;
  }

  p {
    color: #6b7280;
    font-weight: 500;
    font-size: clamp(0.875rem, 2vw, 1rem);
  }
`;

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const card1 = useInView({ threshold: 0.2 });
  const card2 = useInView({ threshold: 0.2 });
  const card3 = useInView({ threshold: 0.2 });
  const card4 = useInView({ threshold: 0.2 });

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const role = user.role.toLowerCase();
      console.log('🔍 HomePage redirect check:', {
        isAuthenticated,
        userEmail: user.email,
        userRole: user.role,
        roleLowercase: role,
      });
      if (role === 'player') {
        console.log('↪️ Redirecting player to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (role === 'admin') {
        console.log('↪️ Redirecting admin to /admin');
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const phrases = [
    'conocer y mejorar mas sobre pádel',
    'encontrar la mejor pala para ti',
    'encontrar entrenadores cerca de ti',
    'comparar precios',
    'mejorar tu rendimiento en pista',
  ];

  return (
    <Container>
      <HeroSection>
        <HeroContent>
          <Badge>
            <FiZap size={16} />
            Impulsado por IA
          </Badge>

          <Title>
            <TitleStaticBefore>La aplicacion que te permite</TitleStaticBefore>
            <RotatingPhrases phrases={phrases} />
          </Title>

          <Subtitle>
            En Smashly, tenemos como objetivo ayudarte a mejorar tu juego de forma sencilla y
            efectiva.
          </Subtitle>

          <CTAButtons>
            <PrimaryButton to='/catalog'>
              <FiSearch size={20} />
              Explorar catálogo
            </PrimaryButton>
            <SecondaryButton to='/compare'>
              <FiTarget size={20} />
              Encontrar mi pala ideal
            </SecondaryButton>
          </CTAButtons>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <FeaturesContent>
          <SectionTitle>¿Por qué elegir Smashly?</SectionTitle>
          <SectionSubtitle>La tecnología más avanzada para encontrar tu pala ideal</SectionSubtitle>

          <FeaturesGrid>
            <FeatureCard ref={card1.ref} $inView={card1.inView} style={{ '--delay': '0s' } as React.CSSProperties}>
              <FeatureIcon>
                <FiTarget />
              </FeatureIcon>
              <FeatureTitle>Comparador Inteligente</FeatureTitle>
              <FeatureDescription>
                Compara hasta 3 palas lado a lado con análisis detallado de pros y contras para cada
                modelo.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard ref={card2.ref} $inView={card2.inView} style={{ '--delay': '0.1s' } as React.CSSProperties}>
              <FeatureIcon>
                <FiDatabase />
              </FeatureIcon>
              <FeatureTitle>Base de Datos Completa</FeatureTitle>
              <FeatureDescription>
                Más de 800 modelos de las mejores marcas con precios actualizados en tiempo real.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard ref={card3.ref} $inView={card3.inView} style={{ '--delay': '0.2s' } as React.CSSProperties}>
              <FeatureIcon>
                <FiSearch />
              </FeatureIcon>
              <FeatureTitle>Búsqueda Inteligente</FeatureTitle>
              <FeatureDescription>
                Encuentra cualquier pala al instante con nuestro buscador global avanzado y filtros
                inteligentes.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard ref={card4.ref} $inView={card4.inView} style={{ '--delay': '0.3s' } as React.CSSProperties}>
              <FeatureIcon>
                <FiDollarSign />
              </FeatureIcon>
              <FeatureTitle>Comparador de precios</FeatureTitle>
              <FeatureDescription>
                Encuentra tu pala favorita y obtén el mejor precio entre todas las tiendas
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </FeaturesContent>
      </FeaturesSection>

      <AiBanner />

      <StatsSection>
        <StatsGrid>
          <StatItem>
            <h3>+800</h3>
            <p>Palas analizadas</p>
          </StatItem>
          <StatItem>
            <h3>95%</h3>
            <p>Precisión IA</p>
          </StatItem>
          <StatItem>
            <h3>24/7</h3>
            <p>Disponibilidad</p>
          </StatItem>
        </StatsGrid>
      </StatsSection>
    </Container>
  );
};

export default HomePage;
