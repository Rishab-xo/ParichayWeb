import React from 'react';
import Navbar from '../components/Navbar';
import JwtConsoleLogger from '../components/JwtConsoleLogger';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="app-layout">
      <JwtConsoleLogger />
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

