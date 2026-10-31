import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { ChevronDown } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);

  const isArgumentsActive =
    location.pathname === '/arguments' ||
    (location.pathname.startsWith('/workspace') &&
      (searchParams.get('tab') === 'free-arguments' || searchParams.get('tab') === 'arguments'));

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-logo">
          <NavLink to="/">
            <span className="brand-text">Refirm</span>
          </NavLink>
        </div>

        {/* Center Navigation Links (Matching Reference Images 2, 4, 5) */}
        <div className="navbar-links">
          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setShowFeaturesDropdown(true)}
            onMouseLeave={() => setShowFeaturesDropdown(false)}
          >
            <button className="nav-dropdown-btn">
              <span>Features</span>
              <ChevronDown size={13} />
            </button>
            {showFeaturesDropdown && (
              <div className="nav-dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowFeaturesDropdown(false);
                    navigate('/workspaces?tab=drafting');
                  }}
                >
                  <span className="dropdown-item-title">Drafting Studio</span>
                  <span className="dropdown-item-desc">Court-ready statutory pleadings &amp; OKF templates</span>
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowFeaturesDropdown(false);
                    navigate('/workspaces?tab=review');
                  }}
                >
                  <span className="dropdown-item-title">Document Review</span>
                  <span className="dropdown-item-desc">Clause risk assessment &amp; 10-dimension audit</span>
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowFeaturesDropdown(false);
                    navigate('/workspaces?tab=free-arguments');
                  }}
                >
                  <span className="dropdown-item-title">Arguments Studio</span>
                  <span className="dropdown-item-desc">Oral hearing pitches &amp; statutory argument sheets</span>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/judgments" className={({ isActive }) => (isActive ? 'active' : '')}>
            Judgments
          </NavLink>

          <NavLink to="/acts" className={({ isActive }) => (isActive ? 'active' : '')}>
            Acts
          </NavLink>

          <NavLink
            to="/workspaces?tab=free-arguments"
            className={isArgumentsActive ? 'active' : ''}
          >
            Arguments
          </NavLink>

          <NavLink to="/intake" className={({ isActive }) => (isActive ? 'active' : '')}>
            Intake
          </NavLink>
        </div>

        {/* Right CTA & Auth */}
        <div className="navbar-action">
          <button className="btn-open-workspace" onClick={() => navigate('/workspaces')}>
            <span>Open Workspace</span>
          </button>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-signin-minimal">Sign in</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
