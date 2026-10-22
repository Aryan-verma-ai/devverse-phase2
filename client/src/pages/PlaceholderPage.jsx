import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';

export default function PlaceholderPage({ title, eyebrow, tier, description, quickLinks }) {
  const location = useLocation();
  const params = useParams();

  return (
    <div className="wrap" style={{ padding: '40px 24px 80px' }}>
      <div className="glass card-lift" style={{ padding: '40px', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className="chip chip-accent">{eyebrow || 'Destination'}</span>
          <span className="chip">{tier || 'Tier 1'}</span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            Route: {location.pathname}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: '16px' }}>{title}</h1>
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
          {description || 'This destination is successfully wired to the DevVerse AppShell.'}
        </p>

        {Object.keys(params).length > 0 && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-hover)' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
              Route Parameters: {JSON.stringify(params)}
            </span>
          </div>
        )}

        <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-strong)', marginBottom: '28px', background: 'var(--surface)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            ✓ Shell Wireframe Connected
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            AppShell navigation, responsive layout container, theme switching, and keyboard focus are active. Feature components will be migrated in subsequent task slices.
          </div>
        </div>

        {quickLinks && quickLinks.length > 0 && (
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Related Navigation
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {quickLinks.map((ql) => (
                <Link key={ql.path} to={ql.path} className="btn btn-ghost btn-sm">
                  {ql.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
