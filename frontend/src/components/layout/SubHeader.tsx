import React from 'react';
import { Book, Compass, House, Stack } from '@phosphor-icons/react';
import { Link, useRouterState } from '@tanstack/react-router';
import styled from 'styled-components';

const SubHeaderContainer = styled.div`
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 2px var(--shadow-color);
  position: sticky;
  top: calc(64px + env(safe-area-inset-top, 0));
  z-index: 320;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const SubHeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 100%;

  @media (max-width: 1200px) {
    padding: 0 clamp(16px, 3vw, 32px);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavItem = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => (props.$isActive ? 'var(--primary-hover)' : 'var(--text-muted)')};
  text-decoration: none;
  font-weight: ${props => (props.$isActive ? '600' : '500')};
  font-size: 0.875rem;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    color: var(--primary-hover);
    background: var(--primary-subtle);
    text-decoration: none;
  }

  ${props =>
    props.$isActive &&
    `
    background: var(--primary-subtle);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: var(--primary-hover);
      border-radius: 1px;
    }
  `}
`;

const NavIcon = styled.div`
  font-size: 0.95rem;
  display: flex;
  align-items: center;
`;

const NavText = styled.span`
  white-space: nowrap;
  font-size: 0.875rem;
`;

const SubHeader: React.FC = () => {
  const { location } = useRouterState();

  const isActive = (path: string) => location.pathname === path;

  // '/' itself dispatches to the right role home via the router's beforeLoad
  // (see indexRoute in router.tsx), so "Inicio" always points there — no
  // need to duplicate the role→path mapping here. "Active" covers every
  // role's actual home page so the highlight doesn't disappear once the
  // redirect has landed.
  const HOME_PAGES = ['/', '/dashboard', '/store/dashboard', '/admin'];

  const navigationItems = [
    {
      to: '/' as const,
      icon: <House />,
      text: 'Inicio',
      isActive: HOME_PAGES.includes(location.pathname),
    },
    {
      to: '/catalog',
      icon: <Compass />,
      text: 'Catálogo de Palas',
      isActive: isActive('/catalog'),
    },
    {
      to: '/compare',
      icon: <Stack />,
      text: 'Comparar Palas',
      isActive: isActive('/compare'),
    },
    {
      to: '/faq',
      icon: <Book />,
      text: 'FAQ',
      isActive: isActive('/faq'),
    },
  ];

  return (
    <SubHeaderContainer>
      <SubHeaderContent>
        <Navigation>
          {navigationItems.map(item => (
            <NavItem key={item.to} to={item.to} $isActive={item.isActive}>
              <NavIcon>{item.icon}</NavIcon>
              <NavText>{item.text}</NavText>
            </NavItem>
          ))}
        </Navigation>
      </SubHeaderContent>
    </SubHeaderContainer>
  );
};

export default SubHeader;
