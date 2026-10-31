import React from 'react';
import Navbar from '../components/Navbar';
import JwtConsoleLogger from '../components/JwtConsoleLogger';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const MainLayout = () => {
  const location = useLocation();
  const isWorkspace =
    location.pathname.startsWith('/workspace') || location.pathname === '/input';

  return (
    <div className={`app-layout ${isWorkspace ? 'is-workspace-layout' : ''}`}>
      <JwtConsoleLogger />
      {!isWorkspace && <Navbar />}
      <main className={isWorkspace ? 'workspace-main-wrapper' : ''}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
