import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiX, FiUser, FiLogOut, FiHome, FiGrid, FiBarChart2, FiHelpCircle, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import GlobalSearch from '../features/GlobalSearch';
import { NotificationBell, MobileNotificationBell } from '../notifications/NotificationBell';

const HeaderContainer = styled.header`
  background: #15803d;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 350;
  padding-top: env(safe-area-inset-top, 0);
  will-change: transform;
  transform: translateZ(0);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  width: 100%;

  @media (max-width: 1200px) {
    padding: 0 clamp(16px, 3vw, 32px);
  }

  @media (max-width: 768px) {
    padding: 0 12px;
    min-height: 56px;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;

  img {
    height: 60px;
    width: auto;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 768px) {
      height: 40px;
    }

    @media (max-width: 480px) {
      height: 36px;
    }
  }

  &:hover {
    text-decoration: none;

    img {
      transform: scale(1.03);
    }
  }
`;

const CentralSearchContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 420px;
  width: 100%;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileElements = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    gap: 2px;
  }
`;

const MobileSearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  min-width: 40px;
  min-height: 40px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    padding: 6px;
    font-size: 1rem;
    min-width: 36px;
    min-height: 36px;
  }
`;

const MobileMenuDropdown = styled(motion.div)<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  max-height: min(85dvh, 720px);
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-top: none;
  
  will-change: transform, opacity;
  transform-origin: top;
  transform: translateY(${props => props.$isOpen ? '0' : '-8px'});
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
`;

const MobileSearchContainer = styled.div<{ $isOpen: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s ease;
  overflow: visible;
  position: relative;
  z-index: 101;

  @media (min-width: 1025px) {
    display: none;
  }
`;

const MobileNavSection = styled.div`
  padding: 1.25rem 1rem;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  }
`;

const MobileNavTitle = styled.h4`
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  margin: 0 0 0.75rem 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const NavLink = styled(Link)<{ $isActive: boolean; $isMobile?: boolean }>`
  color: ${props => (props.$isMobile ? '#374151' : 'white')};
  text-decoration: none;
  font-weight: 500;
  padding: ${props => (props.$isMobile ? '12px 16px' : '8px 16px')};
  border-radius: ${props => (props.$isMobile ? '10px' : '8px')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props =>
    props.$isActive && !props.$isMobile ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  margin-bottom: ${props => (props.$isMobile ? '2px' : '0')};
  font-size: 0.9rem;

  ${props =>
    props.$isMobile &&
    `
    background: ${props.$isActive ? 'rgba(22, 163, 74, 0.06)' : 'transparent'};
    color: ${props.$isActive ? '#15803d' : '#374151'};
    font-weight: ${props.$isActive ? '600' : '500'};
    
    svg {
      color: ${props.$isActive ? '#15803d' : '#9ca3af'};
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }
  `}

  &:hover {
    background: ${props => (props.$isMobile ? '#f9fafb' : 'rgba(255, 255, 255, 0.08)')};
    color: ${props => (props.$isMobile ? '#15803d' : 'white')};
    text-decoration: none;
    transform: ${props => (props.$isMobile ? 'translateX(3px)' : 'none')};
    
    svg {
      color: #15803d;
    }
  }

  &:active {
    transform: scale(0.98) ${props => (props.$isMobile ? 'translateX(3px)' : 'none')};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  min-width: 40px;
  min-height: 40px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  opacity: 0.9;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
    padding: 6px;
    min-width: 36px;
    min-height: 36px;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const AuthButton = styled.button<{
  $variant?: 'primary' | 'secondary';
  $isMobile?: boolean;
}>`
  padding: ${props => (props.$isMobile ? '12px 16px' : '7px 18px')};
  border-radius: ${props => (props.$isMobile ? '12px' : '8px')};
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  font-size: 0.875rem;
  font-family: inherit;
  width: ${props => (props.$isMobile ? '100%' : 'auto')};
  letter-spacing: -0.01em;

  ${props => {
    if (props.$isMobile) {
      return props.$variant === 'primary'
        ? `
        background: #15803d;
        color: white;
        box-shadow: 0 2px 8px rgba(21, 128, 61, 0.2);
        
        &:hover {
          background: #166534;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(21, 128, 61, 0.25);
          color: white;
        }
      `
        : `
        background: white;
        color: #374151;
        border: 1.5px solid #e5e7eb;
        
        &:hover {
          background: #f9fafb;
          border-color: #15803d;
          color: #15803d;
        }
      `;
    } else {
      return props.$variant === 'primary'
        ? `
        background: white;
        color: #15803d;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        &:hover {
          background: #f0fdf4;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `
        : `
        background: transparent;
        color: white;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        
        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.4);
        }
      `;
    }
  }}

  &:active {
    transform: scale(0.97) translateY(0);
  }
`;

const LogoutButton = styled.button<{
  $variant?: 'primary' | 'secondary';
  $isMobile?: boolean;
}>`
  padding: ${props => (props.$isMobile ? '12px 16px' : '7px 18px')};
  border-radius: ${props => (props.$isMobile ? '12px' : '8px')};
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: white;
  font-size: 0.875rem;
  font-family: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    text-decoration: none;
  }

  ${props =>
    props.$isMobile &&
    `
    background: white;
    color: #374151;
    border: 1.5px solid #e5e7eb;
    width: 100%;
    
    &:hover {
      background: #f9fafb;
      border-color: #dc2626;
      color: #dc2626;
      text-decoration: none;
    }
  `}

  &:active {
    transform: scale(0.97);
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AvatarButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: white;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.97);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    color: #15803d;
    font-size: 18px;
  }
`;

const UserDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  min-width: 200px;
  opacity: ${props => (props.$isOpen ? '1' : '0')};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${props => (props.$isOpen ? '0' : '-6px')});
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 14px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border-left: 1px solid rgba(0, 0, 0, 0.04);
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;

  &:hover {
    background: #f9fafb;
    color: #15803d;
  }

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
    color: #dc2626;
    
    &:hover {
      background: #fef2f2;
      color: #b91c1c;
    }
  }

  svg {
    font-size: 18px;
    color: #9ca3af;
    transition: color 0.15s ease;
  }

  &:hover svg {
    color: #15803d;
  }

  &:last-child svg {
    color: #ef4444;
  }

  &:last-child:hover svg {
    color: #b91c1c;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 0 12px;
`;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { userProfile, signOut } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsMobileSearchOpen(false);
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen) {
      setIsMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to='/' onClick={closeAllMenus}>
          <img src='/images/icons/smashly-large-icon.ico' alt='Smashly' />
        </Logo>

        <CentralSearchContainer>
          <GlobalSearch onSearchToggle={() => {}} isInHeader={true} isMobileContext={false} />
        </CentralSearchContainer>

        <AuthButtons>
          {userProfile ? (
            <UserMenuContainer ref={userMenuRef}>
              <NotificationBell />
              <AvatarButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-label="Menú de usuario">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt='Avatar' />
                ) : (
                  <FiUser />
                )}
              </AvatarButton>
              <UserDropdown $isOpen={isUserMenuOpen}>
                <DropdownItem
                  onClick={() => {
                    navigate('/profile');
                    setIsUserMenuOpen(false);
                  }}
                >
                  <FiUser />
                  Mi cuenta
                </DropdownItem>
                <Divider />
                <DropdownItem
                  onClick={async () => {
                    await signOut();
                    setIsUserMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <FiLogOut />
                  Cerrar sesión
                </DropdownItem>
              </UserDropdown>
            </UserMenuContainer>
          ) : (
            <>
              <AuthButton onClick={openLogin} $variant='secondary'>
                Iniciar sesión
              </AuthButton>
              <AuthButton onClick={openRegister} $variant='primary'>
                Registrarse
              </AuthButton>
            </>
          )}
        </AuthButtons>

        <MobileElements>
          <MobileNotificationBell />
          <MobileSearchButton onClick={toggleMobileSearch} aria-label="Buscar">
            <FiSearch />
          </MobileSearchButton>
          <MobileMenuButton onClick={toggleMenu} aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </MobileMenuButton>
        </MobileElements>

        <MobileMenuDropdown
          $isOpen={isMenuOpen || isMobileSearchOpen}
          initial={false}
        >
          <MobileSearchContainer $isOpen={isMobileSearchOpen}>
            <GlobalSearch
              onSearchToggle={setIsMobileSearchOpen}
              isInHeader={true}
              isMobileContext={true}
            />
          </MobileSearchContainer>

          <div
            style={{
              opacity: isMenuOpen ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: isMenuOpen ? 'auto' : 'none',
            }}
          >
            <MobileNavSection>
              <MobileNavTitle>Navegación</MobileNavTitle>
              <NavLink to='/' $isActive={isActive('/')} $isMobile onClick={closeAllMenus}>
                <FiHome />
                Inicio
              </NavLink>
              <NavLink
                to='/catalog'
                $isActive={isActive('/catalog')}
                $isMobile
                onClick={closeAllMenus}
              >
                <FiGrid />
                Catálogo de Palas
              </NavLink>
              <NavLink
                to='/compare'
                $isActive={isActive('/compare')}
                $isMobile
                onClick={closeAllMenus}
              >
                <FiBarChart2 />
                Comparar palas
              </NavLink>
              <NavLink
                to='/faq'
                $isActive={isActive('/faq')}
                $isMobile
                onClick={closeAllMenus}
              >
                <FiHelpCircle />
                FAQ
              </NavLink>
            </MobileNavSection>

            <MobileNavSection>
              <MobileNavTitle>Cuenta</MobileNavTitle>
              {userProfile ? (
                <>
                  <NavLink
                    to='/profile'
                    $isActive={isActive('/profile')}
                    $isMobile
                    onClick={closeAllMenus}
                  >
                    <FiUser />
                    Mi cuenta
                  </NavLink>
                  <LogoutButton
                    $variant='secondary'
                    $isMobile
                    onClick={async () => {
                      await signOut();
                      closeAllMenus();
                      navigate('/');
                    }}
                    style={{ cursor: 'pointer', marginTop: '0.5rem', width: '100%' }}
                  >
                    <FiLogOut style={{ marginRight: '8px' }} />
                    Cerrar sesión
                  </LogoutButton>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <AuthButton
                    $variant='secondary'
                    $isMobile
                    onClick={() => {
                      closeAllMenus();
                      openLogin();
                    }}
                  >
                    <FiLogIn />
                    Iniciar sesión
                  </AuthButton>
                  <AuthButton
                    $variant='primary'
                    $isMobile
                    onClick={() => {
                      closeAllMenus();
                      openRegister();
                    }}
                  >
                    <FiUserPlus />
                    Registrarse
                  </AuthButton>
                </div>
              )}
            </MobileNavSection>
          </div>
        </MobileMenuDropdown>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;