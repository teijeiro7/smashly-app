import React from 'react';
import { useNavigate, useSearch, Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  WarningCircle,
  ShieldWarning,
  MagnifyingGlass,
  LockKey,
  House,
  ArrowLeft,
  GitDiff,
  Storefront,
} from '@phosphor-icons/react';
import SEO from '../components/seo/SEO';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--header-height, 72px));
  padding: var(--space-8, 2rem) var(--space-4, 1rem);
  text-align: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, var(--bg-glow-primary), transparent 60%),
    radial-gradient(circle at 10% 80%, var(--bg-glow-secondary), transparent 40%),
    var(--bg);
`;

const MotionCard = styled(motion.div)`
  background: var(--surface);
  border-radius: var(--radius-2xl, 1.5rem);
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem);
  max-width: 540px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 480px) {
    padding: 2rem 1.25rem;
    border-radius: var(--radius-xl, 1rem);
  }
`;

const IconWrapper = styled.div<{ $color?: string }>`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--primary-faint);
  border: 1px solid var(--primary-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color || 'var(--primary)'};
  margin-bottom: var(--space-4, 1rem);

  svg {
    width: 36px;
    height: 36px;
  }
`;

const ErrorBadge = styled.span`
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-hover);
  background: var(--primary-subtle);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  margin-bottom: var(--space-2, 0.5rem);
`;

const ErrorCode = styled.h1`
  font-size: clamp(3.5rem, 8vw, 5.5rem);
  line-height: 1;
  margin: 0.25rem 0;
  color: var(--text);
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const ErrorTitle = styled.h2`
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  margin: var(--space-2, 0.5rem) 0 var(--space-3, 0.75rem);
  color: var(--text);
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0 0 var(--space-6, 1.5rem);
  line-height: 1.6;
  max-width: 440px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-3, 0.75rem);
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  min-height: 46px;
  border-radius: var(--radius-md, 0.5rem);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--brand-surface);
  color: var(--brand-on-surface);
  border: none;
  box-shadow: 0 4px 14px var(--shadow-color);
  transition: all 0.2s ease;

  &:hover {
    background: var(--brand-surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--shadow-color);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  min-height: 46px;
  border-radius: var(--radius-md, 0.5rem);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border-strong);
  transition: all 0.2s ease;

  &:hover {
    background: var(--surface-2);
    border-color: var(--primary);
    color: var(--primary-hover);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const QuickLinksSection = styled.div`
  margin-top: var(--space-6, 1.5rem);
  padding-top: var(--space-5, 1.25rem);
  border-top: 1px solid var(--border);
  width: 100%;
`;

const QuickLinksTitle = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--space-3, 0.75rem);
`;

const QuickLinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-2, 0.5rem);
  width: 100%;
`;

const QuickLinkItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: var(--surface-3);
    color: var(--primary-hover);
    border-color: var(--primary-subtle);
    text-decoration: none;
  }
`;

interface ErrorInfo {
  code: string;
  badge: string;
  title: string;
  message: string;
  icon: React.ReactNode;
}

const errorTypes: Record<string, ErrorInfo> = {
  '403': {
    code: '403',
    badge: 'Acceso Denegado',
    title: 'No tienes permisos suficientes',
    message:
      'Lo sentimos, no dispones de los permisos necesarios para visualizar este contenido. Si crees que se trata de un error, contacta con nosotros.',
    icon: <ShieldWarning weight='duotone' />,
  },
  '404': {
    code: '404',
    badge: 'No Encontrado',
    title: 'Página o recurso no encontrado',
    message:
      'La página que buscas no existe, ha sido movida o la dirección escrita no es correcta.',
    icon: <MagnifyingGlass weight='duotone' />,
  },
  '500': {
    code: '500',
    badge: 'Error del Servidor',
    title: 'Algo falló en nuestros servidores',
    message:
      'Se ha producido un problema inesperado en el servidor. Estamos trabajando para resolverlo lo antes posible.',
    icon: <WarningCircle weight='duotone' />,
  },
  unauthorized: {
    code: '401',
    badge: 'Sesión Requerida',
    title: 'Identificación requerida',
    message: 'Necesitas iniciar sesión con tu cuenta para acceder a esta sección de Smashly.',
    icon: <LockKey weight='duotone' />,
  },
  default: {
    code: 'ERROR',
    badge: 'Estado de Error',
    title: 'Ha ocurrido un error inesperado',
    message: 'Algo no salió como esperábamos. Por favor, intenta nuevamente más tarde.',
    icon: <WarningCircle weight='duotone' />,
  },
};

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { type?: string; message?: string };

  const errorType = search.type || 'default';
  const customMessage = search.message;

  const error = errorTypes[errorType] || errorTypes['default'];

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <ErrorContainer>
      <SEO
        title={`${error.title} | Smashly`}
        description={error.message}
        noindex
        nofollow
      />
      <MotionCard
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <IconWrapper>{error.icon}</IconWrapper>
        <ErrorBadge>{error.badge}</ErrorBadge>
        <ErrorCode>{error.code}</ErrorCode>
        <ErrorTitle>{error.title}</ErrorTitle>
        <ErrorMessage>{customMessage || error.message}</ErrorMessage>

        <ButtonGroup>
          {errorType === 'unauthorized' ? (
            <>
              <PrimaryBtn onClick={handleGoHome}>
                <House size={18} weight='bold' />
                Ir a Inicio
              </PrimaryBtn>
            </>
          ) : (
            <>
              <PrimaryBtn onClick={handleGoHome}>
                <House size={18} weight='bold' />
                Ir a Inicio
              </PrimaryBtn>
              <SecondaryBtn onClick={handleGoBack}>
                <ArrowLeft size={18} weight='bold' />
                Volver Atrás
              </SecondaryBtn>
            </>
          )}
        </ButtonGroup>

        <QuickLinksSection>
          <QuickLinksTitle>O explora Smashly</QuickLinksTitle>
          <QuickLinksGrid>
            <QuickLinkItem to='/catalog'>
              <MagnifyingGlass size={15} />
              Catálogo
            </QuickLinkItem>
            <QuickLinkItem to='/compare'>
              <GitDiff size={15} />
              Comparador
            </QuickLinkItem>
            <QuickLinkItem to='/stores'>
              <Storefront size={15} />
              Tiendas
            </QuickLinkItem>
          </QuickLinksGrid>
        </QuickLinksSection>
      </MotionCard>
    </ErrorContainer>
  );
};

export default ErrorPage;

