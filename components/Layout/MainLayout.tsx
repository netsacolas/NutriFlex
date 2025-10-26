import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';
import AIAssistantFAB from '../AIAssistantFAB';

const MainLayout: React.FC = () => {
  const location = useLocation();

  // Páginas que não devem mostrar o menu de navegação
  const hideNavigation = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Sidebar para Desktop (lg breakpoint = 1024px+) */}
      {!hideNavigation && <Sidebar />}

      {/* Main Content com padding left no desktop para compensar sidebar */}
      <main className={`${!hideNavigation ? 'pb-20 lg:pb-0 lg:pl-64' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation apenas no Mobile */}
      {!hideNavigation && <BottomNavigation />}

      {/* FAB ajustado para desktop (margem left para sidebar) */}
      {!hideNavigation && (
        <div className="lg:pl-64">
          <AIAssistantFAB />
        </div>
      )}
    </div>
  );
};

export default MainLayout;