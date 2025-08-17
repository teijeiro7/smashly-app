import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RacketsProvider } from './contexts/RacketsContext';
import BestRacketPage from './pages/BestRacketPage';
import GlobalStyles from './styles/GlobalStyles';

function App() {
  return (
    <Router>
      <AuthProvider>
        <RacketsProvider>
          <GlobalStyles />
          <Routes>
            <Route path="/" element={<Navigate to="/recommendations" replace />} />
            <Route path="/recommendations" element={<BestRacketPage />} />
          </Routes>
          <Toaster position="top-right" />
        </RacketsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
