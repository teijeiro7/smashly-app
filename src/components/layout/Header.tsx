import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  padding: 0;
  box-shadow: 0 2px 20px rgba(22, 163, 74, 0.15);
  top: 0;
  z-index: 100;
  position: relative;
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

const Logo = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;

  img {
    height: 75px;
    width: auto;
    transition: transform 0.2s ease;
  }

  &:hover {
    text-decoration: none;

    img {
      transform: scale(1.05);
    }
  }
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo href="/">
          <img src="/images/icons/smashly-large-icon.ico" alt="Smashly" />
        </Logo>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
