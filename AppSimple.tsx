import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages - Import direto sem lazy loading
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

// Simple App without Auth for testing
const AppSimple: React.FC = () => {
  console.log("AppSimple rendering...");

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default AppSimple;