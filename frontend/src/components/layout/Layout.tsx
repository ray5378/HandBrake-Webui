import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Toast from '../common/Toast';
import VideoPlayer from '../VideoPlayer';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='min-h-screen bg-dark-900'>
      <Toast />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className='lg:pl-64'>
        <main className='min-h-screen pb-24 lg:pb-0'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav onMenuClick={() => setSidebarOpen(true)} />
      <VideoPlayer />
    </div>
  );
}
