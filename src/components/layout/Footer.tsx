import React from "react";
import { FiGithub, FiHeart, FiMail, FiTwitter } from "react-icons/fi";
import { Link } from "react-router-dom";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background: #1f2937;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const FooterSection = styled.div`
  h3 {
    color: #16a34a;
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: #d1d5db;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #16a34a;
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #374151;
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: #9ca3af;
    font-size: 1.25rem;
    transition: color 0.2s ease;

    &:hover {
      color: #16a34a;
    }
  }
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <FooterSection>
            <h3>Smashly</h3>
            <p style={{ color: "#d1d5db", lineHeight: "1.6" }}>
              Tu asistente inteligente para encontrar la pala de pádel perfecta.
              Más de 200 modelos analizados por IA para ayudarte a mejorar tu
              juego.
            </p>
          </FooterSection>

          <FooterSection>
            <h3>Navegación</h3>
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <Link to="/rackets">Comparar Palas</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Cuenta</h3>
            <ul>
              <li>
                <Link to="/login">Iniciar sesión</Link>
              </li>
              <li>
                <Link to="/register">Registrarse</Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection>
            <h3>Soporte</h3>
            <ul>
              <li>
                <a href="mailto:support@smashly.app">Contacto</a>
              </li>
              <li>
                <a href="/privacy">Política de Privacidad</a>
              </li>
              <li>
                <a href="/terms">Términos de Uso</a>
              </li>
            </ul>
          </FooterSection>
        </FooterGrid>

        <FooterBottom>
          <Copyright>
            © 2025 Smashly. Hecho con <FiHeart color="#ef4444" /> para los
            amantes del pádel.
          </Copyright>

          <SocialLinks>
            <a
              href="https://github.com/smashly"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiGithub />
            </a>
            <a
              href="https://twitter.com/smashly"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiTwitter />
            </a>
            <a href="mailto:hello@smashly.app">
              <FiMail />
            </a>
          </SocialLinks>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
