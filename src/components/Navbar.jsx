import React from 'react';
import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import '../styles/Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <div className="navbar-logo">
                    <NavLink to="/">
                        {/* Simple logo placeholder with icon */}
                        <span> Parichay</span>
                    </NavLink>
                </div>

                <div className="navbar-links">
                    <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>Documents</NavLink>
                    <NavLink to="/women-safety" className={({ isActive }) => (isActive ? 'active' : '')}>Women Safety</NavLink>
                    <NavLink to="/find-lawyer" className={({ isActive }) => (isActive ? 'active' : '')}>Find a Lawyer</NavLink>
                    <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>How it works</NavLink>
                </div>

                <div className="navbar-action" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn-primary">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;


