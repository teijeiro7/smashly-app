import React, { useEffect } from 'react';
import { FiArrowRight, FiCheck, FiSearch, FiTarget, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import RotatingPhrases from '../components/features/RotatingPhrases';
import { useAuth } from '../contexts/AuthContext';
import { useInView } from '../hooks/useInView';

const heroFadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100dvh;
  background: #f3f7f1;
`;

const HeroSection = styled.section`
  padding: clamp(80px, 12vw, 140px) 20px clamp(60px, 8vw, 100px);
  text-align: center;
  background: linear-gradient(145deg, #0f2818 0%, #14532d 30%, #166534 60%, #15803d 100%);
  color: white;
  position: relative;
  overflow: hidden;
  will-change: transform, opacity;
  transform: translateZ(0);

  @media (max-width: 480px) {
    padding: clamp(60px, 15vw, 80px) 16px clamp(40px, 10vw, 60px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 50% 100%, rgba(22, 163, 74, 0.2) 0%, transparent 60%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 80%;
    height: 200%;
    background: linear-gradient(
      135deg,
      transparent 40%,
      rgba(255, 255, 255, 0.02) 50%,
      transparent 60%
    );
    transform: rotate(-15deg);
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  padding: 10px 20px;
  border-radius: 100px;
  font-size: clamp(0.8rem, 1.8vw, 0.95rem);
  margin-bottom: clamp(24px, 5vw, 40px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  font-weight: 600;
  letter-spacing: 0.02em;
  will-change: transform, opacity;
  animation: ${heroFadeIn} 0.6s ease forwards;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 768px) {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 0.8rem;
    gap: 6px;
  }
`;

const Title = styled.h1`
  font-size: clamp(2rem, 7vw, 5rem);
  font-weight: 800;
  margin-bottom: clamp(16px, 4vw, 32px);
  line-height: 1.05;
  text-align: center;
  max-width: 1100px;
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
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  letter-spacing: -0.03em;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 640px) {
    line-height: 1.1;
    font-size: clamp(1.75rem, 8vw, 2.5rem);
  }

  @media (max-width: 480px) {
    line-height: 1.15;
    font-size: clamp(1.5rem, 9vw, 2rem);
    padding: 0 16px;
  }
`;

const TitleStaticBefore = styled.span`
  display: block;
  white-space: nowrap;
  overflow-wrap: break-word;
  hyphens: auto;

  @media (max-width: 600px) {
    white-space: normal;
  }

  @media (max-width: 400px) {
    word-break: break-word;
  }
`;

const Subtitle = styled.p`
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  margin-bottom: clamp(32px, 6vw, 48px);
  opacity: 0.92;
  line-height: 1.6;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
  animation: ${heroFadeIn} 0.8s ease forwards;
  animation-delay: 0.4s;
  font-weight: 400;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0 16px;
    margin-bottom: 24px;
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
    gap: 12px;
  }
`;

const PrimaryButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  color: #15803d;
  min-height: 56px;
  padding: clamp(14px, 3vw, 18px) clamp(28px, 5vw, 40px);
  border-radius: 14px;
  text-decoration: none;
  font-weight: 700;
  font-size: clamp(0.95rem, 2vw, 1.125rem);
  transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  letter-spacing: -0.01em;

  @media (max-width: 640px) {
    width: 100%;
    min-height: 52px;
    padding: 14px 24px;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    text-decoration: none;
    color: #14532d;
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 56px;
  background: transparent;
  color: white;
  padding: clamp(14px, 3vw, 18px) clamp(28px, 5vw, 40px);
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.95rem, 2vw, 1.125rem);
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
    min-height: 52px;
    padding: 14px 24px;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TrustBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding: 0 20px;
  flex-wrap: wrap;
  animation: ${heroFadeIn} 0.8s ease forwards;
  animation-delay: 0.8s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }

  @media (max-width: 640px) {
    gap: 16px;
    margin-top: 24px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    flex-direction: column;
    align-items: flex-start;
    max-width: 280px;
    margin: 24px auto 0;
  }
`;

const TrustItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.85rem;
    width: 100%;
  }
`;

const ScrollIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: clamp(40px, 6vw, 60px);
  animation: ${heroFadeIn} 1s ease forwards;
  animation-delay: 1s;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    display: none;
  }

  &:hover {
    opacity: 1;
  }

  span {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .mouse {
    width: 24px;
    height: 40px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    position: relative;
  }

  .wheel {
    width: 4px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px;
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    animation: scrollWheel 2s ease-in-out infinite;
  }

  @keyframes scrollWheel {
    0%, 100% { opacity: 1; top: 8px; }
    50% { opacity: 0.3; top: 20px; }
  }
`;

const HowItWorksSection = styled.section`
  padding: clamp(64px, 10vw, 96px) 20px;
  background: #f3f7f1;
`;

const HowItWorksContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: clamp(40px, 8vw, 64px);
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 12px;
  color: #1f2937;
  line-height: 1.2;
`;

const SectionSubtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(24px, 4vw, 40px);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
`;

const StepCard = styled.div<{ $inView: boolean }>`
  text-align: center;
  opacity: ${(props) => (props.$inView ? 1 : 0)};
  transform: ${(props) => (props.$inView ? 'translateY(0)' : 'translateY(20px)')};
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: var(--delay, 0s);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    opacity: 1;
    transform: none;
  }
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  background: #15803d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  margin: 0 auto 20px;
`;

const StepTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1f2937;
`;

const StepDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: 1rem;
`;

const FeaturesSection = styled.section`
  padding: clamp(64px, 10vw, 96px) 20px;
  background: white;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(32px, 6vw, 64px);
  align-items: center;
  margin-bottom: clamp(48px, 8vw, 80px);

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  &:nth-child(even) {
    direction: rtl;
    
    > * {
      direction: ltr;
    }

    @media (max-width: 768px) {
      direction: ltr;
    }
  }
`;

const FeatureText = styled.div`
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const FeatureTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 16px;
`;

const FeatureTitle = styled.h3`
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
  line-height: 1.2;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: clamp(1rem, 2vw, 1.125rem);
  margin-bottom: 24px;
`;

const FeatureLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #15803d;
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1), gap 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #166534;
    gap: 12px;
    text-decoration: none;
  }
`;

const FeatureVisual = styled.div`
  background: linear-gradient(135deg, #f3f7f1 0%, #e8f5e9 100%);
  border-radius: 16px;
  padding: clamp(32px, 5vw, 48px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const FeatureVisualIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #15803d;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: 0 10px 15px -3px rgba(21, 128, 61, 0.3);
`;

const SocialProofSection = styled.section`
  padding: clamp(48px, 8vw, 80px) 20px;
  background: #f3f7f1;
`;

const SocialProofContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const Quote = styled.blockquote`
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  color: #1f2937;
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 24px;

  &::before {
    content: '"';
    color: #15803d;
    font-size: 3rem;
    line-height: 0;
    vertical-align: -0.5em;
    margin-right: 4px;
    font-weight: 700;
  }
`;

const QuoteAuthor = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
`;

const QuoteRole = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 4px;
`;

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const step1 = useInView({ threshold: 0.2 });
  const step2 = useInView({ threshold: 0.2 });
  const step3 = useInView({ threshold: 0.2 });

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
    'encontrar tu pala ideal',
    'comparar precios al instante',
    'mejorar tu rendimiento',
    'elegir con confianza',
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
            <TitleStaticBefore>La herramienta que te permite</TitleStaticBefore>
            <RotatingPhrases phrases={phrases} />
          </Title>

          <Subtitle>
            Descubre la pala perfecta para tu estilo de juego entre cientos de modelos analizados con inteligencia artificial.
          </Subtitle>

          <CTAButtons>
            <PrimaryButton to='/compare'>
              <FiTarget size={20} />
              Encontrar mi pala ideal
            </PrimaryButton>
            <SecondaryButton to='/catalog'>
              <FiSearch size={20} />
              Explorar catálogo
            </SecondaryButton>
          </CTAButtons>

          <TrustBar>
            <TrustItem>
              <FiCheck size={18} color="#22c55e" />
              +800 palas analizadas
            </TrustItem>
            <TrustItem>
              <FiCheck size={18} color="#22c55e" />
              Sin registro obligatorio
            </TrustItem>
          </TrustBar>

          <ScrollIndicator onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <span>Descubre más</span>
            <div className="mouse">
              <div className="wheel" />
            </div>
          </ScrollIndicator>
        </HeroContent>
      </HeroSection>

      <HowItWorksSection>
        <HowItWorksContent>
          <SectionHeader>
            <SectionTitle>Encontrar tu pala ideal es simple</SectionTitle>
            <SectionSubtitle>Tres pasos para descubrir la pala perfecta para tu juego</SectionSubtitle>
          </SectionHeader>

          <StepsContainer>
            <StepCard ref={step1.ref} $inView={step1.inView} style={{ '--delay': '0s' } as React.CSSProperties}>
              <StepNumber>1</StepNumber>
              <StepTitle>Cuéntanos tu estilo</StepTitle>
              <StepDescription>
                Respondé unas pocas preguntas sobre tu nivel, estilo de juego y preferencias.
              </StepDescription>
            </StepCard>

            <StepCard ref={step2.ref} $inView={step2.inView} style={{ '--delay': '0.15s' } as React.CSSProperties}>
              <StepNumber>2</StepNumber>
              <StepTitle>Recibe recomendaciones</StepTitle>
              <StepDescription>
                Nuestra IA analiza tu perfil y te sugiere las palas que mejor se adaptan a ti.
              </StepDescription>
            </StepCard>

            <StepCard ref={step3.ref} $inView={step3.inView} style={{ '--delay': '0.3s' } as React.CSSProperties}>
              <StepNumber>3</StepNumber>
              <StepTitle>Compara y elige</StepTitle>
              <StepDescription>
                Compara especificaciones, precios y reseñas para tomar la mejor decisión.
              </StepDescription>
            </StepCard>
          </StepsContainer>
        </HowItWorksContent>
      </HowItWorksSection>

      <FeaturesSection>
        <FeaturesContent>
          <SectionHeader>
            <SectionTitle>Todo lo que necesitas para elegir bien</SectionTitle>
            <SectionSubtitle>Herramientas pensadas para jugadores que saben lo que quieren</SectionSubtitle>
          </SectionHeader>

          <FeatureLayout>
            <FeatureText>
              <FeatureTag>
                <FiTarget size={14} />
                Comparador Inteligente
              </FeatureTag>
              <FeatureTitle>Compara hasta 3 palas lado a lado</FeatureTitle>
              <FeatureDescription>
                Analiza pros y contras de cada modelo con datos técnicos detallados. Pesos, balances, formas, materiales: toda la información que importa, en una sola pantalla.
              </FeatureDescription>
              <FeatureLink to='/compare'>
                Probar comparador
                <FiArrowRight size={18} />
              </FeatureLink>
            </FeatureText>
            <FeatureVisual>
              <FeatureVisualIcon>
                <FiTarget size={32} />
              </FeatureVisualIcon>
            </FeatureVisual>
          </FeatureLayout>

          <FeatureLayout>
            <FeatureText>
              <FeatureTag>
                <FiSearch size={14} />
                Búsqueda Avanzada
              </FeatureTag>
              <FeatureTitle>Encuentra tu pala en segundos</FeatureTitle>
              <FeatureDescription>
                Filtra por marca, forma, balance, peso, rango de precio y más. Nuestro buscador entiende lo que buscas, incluso si no sabes el nombre exacto.
              </FeatureDescription>
              <FeatureLink to='/catalog'>
                Explorar catálogo
                <FiArrowRight size={18} />
              </FeatureLink>
            </FeatureText>
            <FeatureVisual>
              <FeatureVisualIcon>
                <FiSearch size={32} />
              </FeatureVisualIcon>
            </FeatureVisual>
          </FeatureLayout>
        </FeaturesContent>
      </FeaturesSection>

      <SocialProofSection>
        <SocialProofContent>
          <Quote>
            Gracias a Smashly encontré la pala que necesitaba. En 5 minutos supe exactamente qué modelo comprar y dónde conseguirlo más barato.
          </Quote>
          <QuoteAuthor>Carlos Martínez</QuoteAuthor>
          <QuoteRole>Jugador amateur, Madrid</QuoteRole>
        </SocialProofContent>
      </SocialProofSection>
    </Container>
  );
};

export default HomePage;
