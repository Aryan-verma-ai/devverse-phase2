import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export default function DockNavbar({ onToggleMobileMenu, theme, onToggleTheme, mobileMenuOpen }) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

  return (
    <div className="dock-wrap">
      <nav className="dock" aria-label="Primary navigation">
        {/* Brand */}
        <Link to="/" className="dock-brand" title="DevVerse Home">
          <span className="mark">DV</span>
          <span>DevVerse</span>
        </Link>

        {/* Primary Desktop Nav Links */}
        <div className="dock-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `dock-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Action Controls */}
        <div className="dock-actions">
          {/* Search Trigger */}
          <button
            type="button"
            className="dock-icon-btn"
            title="Search everything"
            aria-label="Search everything"
            onClick={() => alert('Command Palette (Ctrl+K) will be connected in Tier 1 foundation.')}
            style={{ width: 'auto', padding: '0 12px', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Search</span>
            <kbd style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: 'var(--surface-hover)', fontFamily: 'var(--font-mono)' }}>
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="dock-icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle theme"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Profile Link */}
          <NavLink
            to="/profile"
            className={({ isActive }) => `dock-icon-btn ${isActive ? 'active' : ''}`}
            title="Profile"
            aria-label="Developer profile"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </NavLink>

          {/* Settings Link */}
          <NavLink
            to="/settings"
            className={({ isActive }) => `dock-icon-btn ${isActive ? 'active' : ''}`}
            title="Settings"
            aria-label="Settings and preferences"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
          </NavLink>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="dock-icon-btn dock-mobile-toggle"
            title="Toggle navigation menu"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-drawer"
            onClick={onToggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
