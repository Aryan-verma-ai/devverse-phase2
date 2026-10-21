import React, { useState, useEffect } from 'react';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('violet');
  const [motion, setMotion] = useState('on');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', motion);
  }, [motion]);

  return (
    <main className="wrap" style={{ padding: '60px 24px 80px', minHeight: '100vh' }}>
      {/* Brand Header */}
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="chip chip-accent">Design Token Foundation</span>
          <span className="chip">Phase B • Prompt 06</span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', marginBottom: '14px' }}>
          DevVerse <span className="grad-text">Design Tokens</span>
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '16px' }}>
          Centralized design system tokens for color hierarchy, typography, glass surfaces, accessible focus rings, and motion preferences.
        </p>
      </header>

      {/* Interactive Token Controls */}
      <section className="glass" style={{ padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Interactive Token Controls</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {/* Theme Switcher */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              CANVAS THEME (data-theme)
            </div>
            <div className="pill-toggle">
              <button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                onClick={() => setTheme('dark')}
              >
                🌙 Dark OS
              </button>
              <button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}
              >
                ☀️ Warm Ivory
              </button>
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              ACCENT COLOR (data-accent)
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'violet', label: 'Violet', color: '#7c6fff' },
                { id: 'cyan', label: 'Cyan', color: '#4fe3c1' },
                { id: 'coral', label: 'Coral', color: '#ff6b5b' },
                { id: 'amber', label: 'Amber', color: '#ffb86b' },
                { id: 'legend', label: 'Legend Gold', color: '#f0c419' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  className={`swatch ${accent === item.id ? 'active-swatch' : ''}`}
                  style={{ background: item.color }}
                  onClick={() => setAccent(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Motion Toggle */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              MOTION PREFERENCE (data-motion)
            </div>
            <div className="pill-toggle">
              <button
                type="button"
                className={motion === 'on' ? 'active' : ''}
                onClick={() => setMotion('on')}
              >
                ⚡ Smooth Motion
              </button>
              <button
                type="button"
                className={motion === 'off' ? 'active' : ''}
                onClick={() => setMotion('off')}
              >
                🛑 Reduced Motion
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Token Showcase Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Card 1: Typography Tokens */}
        <section className="glass card-lift" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Typography Hierarchy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                --font-display: Space Grotesk
              </span>
              <h4 style={{ fontSize: '24px', marginTop: '2px' }}>Where Builders Become Legends</h4>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                --font-body: Inter
              </span>
              <p style={{ fontSize: '14px', marginTop: '2px' }}>
                Readable body copy with balanced line height and accessible contrast across both themes.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                --font-mono: JetBrains Mono
              </span>
              <div style={{ background: 'var(--surface-hover)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px' }}>
                <code>devverse deploy --tier=legend</code>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Interactive Controls & Focus Rings */}
        <section className="glass card-lift" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Interactive Controls & Focus</h3>
          <p style={{ fontSize: '13.5px', marginBottom: '16px' }}>
            Press <kbd style={{ padding: '2px 6px', background: 'var(--surface-hover)', borderRadius: '4px' }}>Tab</kbd> to inspect the 2px visible focus ring on all buttons and inputs.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <button type="button" className="btn btn-primary">Primary Button</button>
            <button type="button" className="btn btn-ghost">Ghost Button</button>
            <button type="button" className="btn btn-outline">Outline Button</button>
          </div>

          <div>
            <label htmlFor="demo-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Accessible Form Input (Tab to focus)
            </label>
            <input
              id="demo-input"
              type="text"
              placeholder="Focus ring follows active accent..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                outline: 'none',
              }}
            />
          </div>
        </section>

        {/* Card 3: Surfaces, Radius & Motion Animation */}
        <section className="glass card-lift" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Surfaces & Motion</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13.5px' }}>Glass Blur & Elevation</span>
              <span className="chip">backdrop-filter: 16px</span>
            </div>

            {/* Motion animation test element */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Motion Pulse Check</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {motion === 'on' ? 'Animation active (respects system / toggle)' : 'Animations disabled via token'}
                </div>
              </div>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 12px var(--accent)',
                  animation: motion === 'on' ? 'dv-demo-pulse 1.8s infinite ease-in-out' : 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="chip">--radius-sm: 10px</span>
              <span className="chip">--radius-md: 16px</span>
              <span className="chip">--radius-lg: 24px</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes dv-demo-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.55; }
        }
      `}</style>
    </main>
  );
}
