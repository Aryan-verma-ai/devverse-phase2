import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_SECTIONS } from './navItems';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" className="dock-brand" style={{ padding: '0 0 12px' }}>
              <span className="mark">DV</span>
              <span>DevVerse</span>
            </Link>
            <p style={{ maxWidth: '280px', fontSize: '13.5px', marginTop: '6px' }}>
              An operating system for developers. Explore projects, compete in hackathons, and build your legend.
            </p>
          </div>

          {FOOTER_SECTIONS.map((sec) => (
            <div key={sec.title}>
              <h4>{sec.title}</h4>
              {sec.links.map((link) => (
                <Link key={link.path} to={link.path}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© 2026 DevVerse. Unified Developer Ecosystem.</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-hover)' }}>
            v2.0.0-react
          </span>
        </div>
      </div>
    </footer>
  );
}
