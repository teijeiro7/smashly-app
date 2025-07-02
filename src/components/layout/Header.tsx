import React, { useState } from "react";
import { FiLogOut, FiMenu, FiSearch, FiUser, FiX } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../contexts/AuthContext.tsx";
import GlobalSearch from "../features/GlobalSearch";

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  padding: 0;
  box-shadow: 0 2px 20px rgba(22, 163, 74, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  text-decoration: none;
  letter-spacing: -0.5px;

  &:hover {
    color: white;
    text-decoration: none;
  }
`;

const Nav = styled.nav<{ isOpen: boolean; isSearchOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    flex-direction: column;
    padding: 2rem;
    transform: translateY(${(props) => (props.isOpen ? "0" : "-100%")});
    transition: transform 0.3s ease;
    box-shadow: 0 4px 20px rgba(22, 163, 74, 0.3);
  }
`;

const NavLink = styled(Link)<{ isActive: boolean; isHidden?: boolean }>`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: ${(props) =>
    props.isActive ? "rgba(255, 255, 255, 0.15)" : "transparent"};
  display: ${(props) => (props.isHidden ? "none" : "block")};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    text-decoration: none;
  }
`;

const SearchButton = styled.button<{ isHidden?: boolean }>`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: ${(props) => (props.isHidden ? "none" : "flex")};
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
  max-width: 500px;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
    max-width: none;
    gap: 0.5rem;
  }
`;

const CloseSearchButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    padding: 6px;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
`;

const AuthButton = styled(Link)<{ variant?: "primary" | "secondary" }>`
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: white;
    color: #16a34a;
    
    &:hover {
      background: #f0f0f0;
      color: #15803d;
      text-decoration: none;
    }
  `
      : `
    background: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      text-decoration: none;
    }
  `}

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
`;

const UserButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    text-decoration: none;
  }
`;

const LogoutButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: 500;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};

  &:hover {
    background: ${(props) =>
      props.disabled ? "transparent" : "rgba(255, 255, 255, 0.1)"};
  }
`;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    // Confirmación opcional
    const confirmLogout = window.confirm(
      "¿Estás seguro de que quieres cerrar sesión?"
    );
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      const { error } = await signOut();

      // Siempre navegar a la página de inicio después del logout,
      // independientemente de si hubo error (porque el estado local se limpia)
      navigate("/");

      if (error) {
        console.warn(
          "Error during logout, but proceeding with navigation:",
          error
        );
        // No mostrar error al usuario si el estado local se limpió correctamente
        // toast o console log en lugar de alert molesto
        console.log("Sesión cerrada localmente (con advertencias)");
      } else {
        console.log("Sesión cerrada exitosamente");
      }

      // Forzar reload de la página para asegurar limpieza completa del estado
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Unexpected error during logout:", error);

      // Aún con error, navegar al inicio y limpiar estado
      navigate("/");

      // Reload para asegurar limpieza
      setTimeout(() => {
        window.location.reload();
      }, 100);

      // Solo mostrar error si es algo crítico
      console.warn(
        "Error inesperado al cerrar sesión, pero sesión limpiada localmente."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">Smashly</Logo>

        <Nav isOpen={isMenuOpen} isSearchOpen={isSearchOpen}>
          {isSearchOpen ? (
            <SearchContainer>
              <GlobalSearch
                onSearchToggle={setIsSearchOpen}
                isInHeader={true}
              />
              <CloseSearchButton onClick={toggleSearch}>
                <FiX />
              </CloseSearchButton>
            </SearchContainer>
          ) : (
            <>
              <SearchButton onClick={toggleSearch}>
                <FiSearch />
              </SearchButton>
              <NavLink to="/" isActive={isActive("/")}>
                Inicio
              </NavLink>
              <NavLink to="/rackets" isActive={isActive("/rackets")}>
                Comparar Palas
              </NavLink>
              <NavLink to="/faq" isActive={isActive("/faq")}>
                FAQ
              </NavLink>
            </>
          )}
        </Nav>

        <AuthButtons>
          {user ? (
            <UserMenu>
              <UserButton to="/profile">
                <FiUser />
                {userProfile?.nickname ||
                  user.email?.split("@")[0] ||
                  "Usuario"}
              </UserButton>
              <LogoutButton onClick={handleLogout} disabled={isLoggingOut}>
                <FiLogOut />
                {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
              </LogoutButton>
            </UserMenu>
          ) : (
            <>
              <AuthButton to="/login" variant="secondary">
                Iniciar sesión
              </AuthButton>
              <AuthButton to="/register" variant="primary">
                Registrarse
              </AuthButton>
            </>
          )}
          <MobileMenuButton onClick={toggleMenu}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </MobileMenuButton>
        </AuthButtons>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
