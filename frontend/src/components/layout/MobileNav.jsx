import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, Play, ListTodo } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/files', icon: FolderOpen, label: '文件' },
  { path: '/transcode', icon: Play, label: '转码' },
  { path: '/jobs', icon: ListTodo, label: '任务' },
];

function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 z-30">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center py-2 px-4 transition-colors",
                isActive ? "text-primary" : "text-gray-400"
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
