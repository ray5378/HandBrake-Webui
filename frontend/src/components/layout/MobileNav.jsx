import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

function MobileNav() {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.dashboard') },
    { path: '/files', icon: FolderOpen, label: t('nav.files') },
    { path: '/jobs', icon: ListTodo, label: t('nav.jobs') }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 z-30">
      <div className="flex justify-around items-center py-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center py-2 px-4 transition-colors',
                isActive ? 'text-primary' : 'text-gray-400'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
