import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, ListTodo, Settings, Layers, LogOut, Menu, X, Video } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import clsx from 'clsx';

function Sidebar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.dashboard') },
    { path: '/files', icon: FolderOpen, label: t('nav.files') },
    { path: '/jobs', icon: ListTodo, label: t('nav.jobs') },
    { path: '/presets', icon: Layers, label: t('nav.presets') },
    { path: '/settings', icon: Settings, label: t('nav.settings') }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-dark-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HandBrake</h1>
                <p className="text-xs text-gray-400">Web UI</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <LanguageSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
