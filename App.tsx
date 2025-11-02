import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { PWAManager } from './components/PWAComponents';
import { initBackgroundSync, SyncStatusBadge } from './utils/backgroundSync';

// Layout
import MainLayout from './components/Layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
import PlanMealPage from './pages/PlanMealPage';
import HistoryPage from './pages/HistoryPage';
import HealthPage from './pages/HealthPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import OnboardingPage from './pages/OnboardingPage';
import HydrationPage from './pages/HydrationPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ThankYouPage from './pages/ThankYouPage';
import { AdminPanel } from './pages/AdminPanelNew';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};

// App Router Component
const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />

        {/* Protected Routes */}
        <Route
          path="home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="plan"
          element={
            <ProtectedRoute>
              <PlanMealPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="health"
          element={
            <ProtectedRoute>
              <HealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hydration"
          element={
            <ProtectedRoute>
              <HydrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="assinatura"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="obrigado"
          element={
            <ProtectedRoute>
              <ThankYouPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  console.log("App component starting...");

  // Initialize PWA, background sync and hydration notifications
  useEffect(() => {
    console.log('🚀 Initializing PWA...');
    try {
      initBackgroundSync();

      // Inicializa notificações de hidratação
      import('./utils/hydrationNotifications').then(module => {
        module.initializeHydrationNotifications();
      });
    } catch (error) {
      console.error("Error initializing background sync:", error);
    }
  }, []);

  console.log("Rendering App component...");

  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          {/* PWA Components */}
          <PWAManager />
          <SyncStatusBadge />

          {/* Main App Router */}
          <AppRouter />
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;


