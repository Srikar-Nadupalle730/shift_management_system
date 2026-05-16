import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { profile, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar animate-fade-in">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Shift Management System
        </Link>
        <div className="flex items-center gap-4">
          {!profile ? (
            <Link to="/login" className="btn btn-primary">Login</Link>
          ) : (
            <>
              {isAdmin ? (
                <Link to="/admin" className="btn btn-secondary">Dashboard</Link>
              ) : (
                <Link to="/employee" className="btn btn-secondary">My Shifts</Link>
              )}
              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{profile.first_name}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{isAdmin ? 'Administrator' : 'Employee'}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px' }} title="Logout">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
