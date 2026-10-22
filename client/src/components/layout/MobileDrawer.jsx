import React, { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';

export default function MobileDrawer({ open, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-menu-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        ref={drawerRef}
        className={`mobile-menu-drawer ${open ? 'open' : ''}`}
        aria-label="Mobile Navigation"
        aria-hidden={!open}
      >
        <div className="mobile-menu-header">
          <Link to="/" onClick={onClose} className="dock-brand" style={{ padding: 0 }}>
            <span className="mark">DV</span>
            <span>DevVerse</span>
          </Link>
          <button
            type="button"
            className="dock-icon-btn"
            onClick={onClose}
            aria-label="Close menu"
            title="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mobile-menu-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/submit-project"
            onClick={onClose}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            style={{ color: 'var(--accent)' }}
          >
            + Submit Project
          </NavLink>
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
          >
            Profile
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
          >
            Settings
          </NavLink>
        </nav>

        <div className="mobile-menu-footer">
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.displayName || user?.username}</strong>
                <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>@{user?.username}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className="btn btn-ghost" style={{ width: '100%' }}>
                Sign In
              </Link>
              <Link to="/signup" onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                Create Account
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
