import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  HeartIcon,
  UserIcon,
  WaterDropIcon,
  SparklesIcon
} from './Icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const adminStatus = await adminService.checkIsAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Shield icon for admin
  const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const baseNavItems: NavItem[] = [
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
      path: '/hydration',
      label: 'Água',
      icon: <WaterDropIcon className="w-6 h-6" />
    },
    {
      path: '/health',
      label: 'Saúde',
      icon: <HeartIcon className="w-6 h-6" />
    },
    {
      path: '/assinatura',
      label: 'Premium',
      icon: <SparklesIcon className="w-6 h-6" />
    },
    {
      path: '/profile',
      label: 'Perfil',
      icon: <UserIcon className="w-6 h-6" />
    }
  ];

  // Add admin item if user is admin
  const navItems: NavItem[] = isAdmin
    ? [
        ...baseNavItems.slice(0, -1), // All items except Profile
        {
          path: '/admin',
          label: 'Admin',
          icon: <ShieldIcon className="w-6 h-6" />
        },
        baseNavItems[baseNavItems.length - 1] // Profile at the end
      ]
    : baseNavItems;

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
