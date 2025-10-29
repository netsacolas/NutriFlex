import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  HeartIcon,
  UserIcon,
  WaterDropIcon,
  SparklesIcon
} from './Icons';
import type { UserProfile } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.substring(0, 2).toUpperCase();
  };

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
      path: '/hydration',
      label: 'Hidratação',
      icon: WaterDropIcon
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
      path: '/assinatura',
      label: 'Assinatura',
      icon: SparklesIcon
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

      {/* User Section */}
      <div className="border-t border-emerald-500/30 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full p-4 hover:bg-emerald-500/20 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {getUserInitials()}
            </div>

            {/* User Info */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-emerald-100 text-xs truncate">
                {user?.email || 'email@exemplo.com'}
              </p>
            </div>

            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 text-emerald-100 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-white rounded-lg shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
            <button
              onClick={() => {
                setShowUserMenu(false);
                navigate('/profile');
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <UserIcon className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">Meu Perfil</span>
            </button>

            <div className="border-t border-gray-100"></div>

            <button
              onClick={() => {
                setShowUserMenu(false);
                handleSignOut();
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sair</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
