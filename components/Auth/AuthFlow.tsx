import React, { useState } from 'react';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { ForgotPassword } from './ForgotPassword';

type AuthView = 'login' | 'signup' | 'forgot-password';

export const AuthFlow: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4">
      <div className="w-full">
        {currentView === 'login' && (
          <Login
            onSwitchToSignUp={() => setCurrentView('signup')}
            onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
          />
        )}

        {currentView === 'signup' && (
          <SignUp onSwitchToLogin={() => setCurrentView('login')} />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPassword onSwitchToLogin={() => setCurrentView('login')} />
        )}
      </div>
    </div>
  );
};
