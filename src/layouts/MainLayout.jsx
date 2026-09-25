import React from 'react';
import Navbar from '../components/Navbar';
import JwtConsoleLogger from '../components/JwtConsoleLogger';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat' || location.pathname === '/lawyer-chat';

  return (
    <div className="app-layout">
      <JwtConsoleLogger />
      {!isChatRoute && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

