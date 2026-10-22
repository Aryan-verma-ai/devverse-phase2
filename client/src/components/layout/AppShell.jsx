import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SkipLink from './SkipLink';
import DockNavbar from './DockNavbar';
import MobileDrawer from './MobileDrawer';
import Footer from './Footer';
import BackToTop from './BackToTop';

export default function AppShell() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('devverse:theme') || 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devverse:theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-shell-root">
      {/* Accessibility Skip Link */}
      <SkipLink />

      {/* Floating Navigation Dock */}
      <header>
        <DockNavbar
          theme={theme}
          onToggleTheme={toggleTheme}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
      </header>

      {/* Mobile Drawer Menu */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Semantic Main Content Area */}
      <main id="main-content" className="app-main">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Back To Top Action */}
      <BackToTop />
    </div>
  );
}
