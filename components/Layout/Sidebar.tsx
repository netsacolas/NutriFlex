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
  icon: React.ComponentType<{ className?: string }>;
}

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/home',
      label: 'Início',
      icon: HomeIcon
    },
    {
      path: '/plan',
      label: 'Planejar',
      icon: ClipboardDocumentListIcon
    },
    {
      path: '/history',
      label: 'Histórico',
      icon: CalendarDaysIcon
    },
    {
      path: '/health',
      label: 'Saúde',
      icon: HeartIcon
    },
    {
      path: '/profile',
      label: 'Perfil',
      icon: UserIcon
    }
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-2xl z-40">
      {/* Logo */}
      <div className="p-6 border-b border-emerald-500/30">
        <div className="flex items-center gap-3">
          <img
            src="/img/nutrimais_logo.png"
            alt="NutriMais Logo"
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-white text-xl font-bold">NutriMais</h1>
            <p className="text-emerald-100 text-xs">Alimentação Inteligente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-emerald-50 hover:bg-emerald-500/30 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                <span className={`font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-emerald-500/30">
        <p className="text-emerald-100 text-xs text-center">
          © 2025 NutriMais AI
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
