import React from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import SubHeader from './SubHeader';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  padding-bottom: 0;

  @media (max-width: 1024px) {
    padding-bottom: calc(78px + env(safe-area-inset-bottom, 0));
  }
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Login/register no longer have their own routes — they're always a modal
  // over whatever page is underneath, so the chrome never needs to hide.
  return (
    <LayoutContainer>
      {/* Skip-to-content: visible only on keyboard focus (WCAG 2.1 AA - criterion 2.4.1) */}
      <a href='#main-content' className='skip-to-content'>
        Saltar al contenido principal
      </a>
      <Header />
      <SubHeader />
      <Main id='main-content' tabIndex={-1}>
        {children}
      </Main>
      <MobileBottomNav />
      <Footer />
    </LayoutContainer>
  );
};

export default Layout;
