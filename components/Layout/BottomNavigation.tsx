import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  HeartIcon,
  UserIcon
} from './Icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/home',
      label: 'Início',
      icon: <HomeIcon className="w-6 h-6" />
    },
    {
      path: '/plan',
      label: 'Planejar',
      icon: <ClipboardDocumentListIcon className="w-6 h-6" />
    },
    {
      path: '/history',
      label: 'Histórico',
      icon: <CalendarDaysIcon className="w-6 h-6" />
    },
    {
      path: '/health',
      label: 'Saúde',
      icon: <HeartIcon className="w-6 h-6" />
    },
    {
      path: '/profile',
      label: 'Perfil',
      icon: <UserIcon className="w-6 h-6" />
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-500'
              }`}
            >
              <div className={`transition-transform duration-200 ${
                isActive ? 'scale-110' : 'scale-100'
              }`}>
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: `w-6 h-6 ${isActive ? 'text-emerald-600' : ''}`
                })}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                isActive ? 'text-emerald-600' : ''
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-t-full transition-all duration-200" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;