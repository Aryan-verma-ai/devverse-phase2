/**
 * DEVVERSE — Portfolio Builder & Viewer Page
 *
 * Grounded in Phase 1 portfolio.html.
 * Dual-mode functionality:
 *   - Editor Mode (for authenticated owner): Live form allowing editing
 *     skills, social links, bio, and visual card preview with persistent server updates.
 *   - Public Viewer Mode (?u=<username> or visitor preview): Read-only portfolio
 *     presentation showing builder credentials and authored projects from MongoDB.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';
import ProjectCard from '../components/ui/ProjectCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';

function getTier(points = 0) {
  if (points >= 600) return { name: 'Legend', color: 'var(--amber, #f59e0b)' };
  if (points >= 300) return { name: 'Architect', color: 'var(--violet, #8b5cf6)' };
  if (points >= 100) return { name: 'Builder', color: 'var(--cyan, #06b6d4)' };
  return { name: 'Novice', color: 'var(--text-tertiary, #94a3b8)' };
}

export default function PortfolioPage() {
  const [searchParams] = useSearchParams();
  const { username: paramUsername } = useParams();
  const { user: authUser, refreshUser } = useAuth();

  const requestedUsername = paramUsername || searchParams.get('u');
  const forcePreview = searchParams.get('view') === '1';

  // Target username: explicitly requested or default to logged-in user
  const targetUsername = requestedUsername || authUser?.username;
  const isOwner = authUser && targetUsername && authUser.username.toLowerCase() === targetUsername.toLowerCase();
  const isEditorMode = isOwner && !forcePreview;

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Form state for editor
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    skillsInput: '',
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  });

  const [saving, setSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPortfolioData() {
      if (!targetUsername) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const res = await userService.getPublicProfile(targetUsername);
        if (isMounted) {
          setProfile(res.user);
          setProjects(res.projects || []);

          // Sync editor form
          setForm({
            displayName: res.user.displayName || '',
            bio: res.user.bio || '',
            avatarUrl: res.user.avatarUrl || '',
            skillsInput: Array.isArray(res.user.skills) ? res.user.skills.join(', ') : '',
            github: res.user.links?.github || '',
            linkedin: res.user.links?.linkedin || '',
            twitter: res.user.links?.twitter || '',
            website: res.user.links?.website || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || `Unable to load portfolio for @${targetUsername}.`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPortfolioData();

    return () => {
      isMounted = false;
    };
  }, [targetUsername]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatusNotice(null);

    const skillsArray = form.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      displayName: form.displayName.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim(),
      skills: skillsArray,
      links: {
        github: form.github.trim(),
        linkedin: form.linkedin.trim(),
        twitter: form.twitter.trim(),
        website: form.website.trim(),
      },
    };

    try {
      const updatedUser = await userService.updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      if (refreshUser) {
        await refreshUser();
      }
      setStatusNotice({ type: 'success', text: 'Portfolio updated and persisted to DevVerse.' });
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.message || 'Failed to save portfolio updates.' });
    } finally {
      setSaving(false);
    }
  }

  function handleCopyShareLink() {
    const url = `${window.location.origin}/portfolio?u=${encodeURIComponent(targetUsername || '')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <LoadingState message={`Loading portfolio for @${targetUsername || 'you'}...`} />
      </div>
    );
  }

  if (!targetUsername) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px' }}>
        <EmptyState
          title="Sign in to customize your portfolio"
          message="Please sign in to manage your portfolio showcase or specify a builder's username like /portfolio?u=alex."
          actionLabel="Go to Sign In"
          onAction={() => window.location.assign('/login')}
        />
      </div>
    );
  }

  if (fetchError || !profile) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px' }}>
        <EmptyState
          title="Portfolio Not Found"
          message={fetchError || `We couldn't locate any builder portfolio for @${targetUsername}.`}
          actionLabel="Explore Projects"
          onAction={() => window.location.assign('/explore')}
        />
      </div>
    );
  }

  const tier = getTier(profile.points || 0);
  const currentSkills = isEditorMode
    ? form.skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
    : profile.skills || [];

  return (
    <div style={{ maxWidth: '1060px', margin: '24px auto', padding: '0 20px 80px' }}>
      {/* Page Title & Navigation Banner */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '6px' }}>
              {isEditorMode ? 'Builder Studio' : 'Developer Showcase'}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              {isEditorMode ? 'Portfolio Builder' : `${profile.displayName}'s Portfolio`}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, maxWidth: '65ch' }}>
              {isEditorMode
                ? 'Curate your developer identity, skills, and projects. Changes are saved to your account and visible to collaborators.'
                : `Verified builder portfolio and project index for @${profile.username}.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={handleCopyShareLink}>
              {copiedLink ? 'Copied Public Link ✓' : 'Share Portfolio'}
            </Button>
            {isOwner && (
              <Link to={isEditorMode ? `/portfolio?u=${profile.username}&view=1` : '/portfolio'}>
                <Button variant={isEditorMode ? 'secondary' : 'primary'} size="sm">
                  {isEditorMode ? 'Preview as Visitor' : 'Open Editor'}
                </Button>
              </Link>
            )}
            <Link to={`/profile?u=${profile.username}`}>
              <Button variant="outline" size="sm">
                Full Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div style={{ marginBottom: '20px' }}>
          <StatusMessage
            type={statusNotice.type}
            message={statusNotice.text}
            onDismiss={() => setStatusNotice(null)}
          />
        </div>
      )}

      {/* Editor & Preview Split or Public Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isEditorMode ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
          gap: '28px',
          alignItems: 'flex-start',
        }}
      >
        {/* Editor Form (Owner only) */}
        {isEditorMode && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Edit Credentials
            </h2>

            <form onSubmit={handleSave} noValidate>
              <FormField id="pf-name" label="Display Name" required>
                <input
                  id="pf-name"
                  type="text"
                  className="field-input"
                  value={form.displayName}
                  onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                  required
                />
              </FormField>

              <FormField id="pf-avatar" label="Avatar URL" hint="Direct link to profile picture">
                <input
                  id="pf-avatar"
                  type="url"
                  className="field-input"
                  placeholder="https://example.com/avatar.png"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                />
              </FormField>

              <FormField id="pf-bio" label="Bio / Mission" hint="What are you currently building or learning?">
                <textarea
                  id="pf-bio"
                  className="field-textarea"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                />
              </FormField>

              <FormField id="pf-skills" label="Skills (comma-separated)" hint="e.g. React, TypeScript, Rust, Docker, GraphQL">
                <input
                  id="pf-skills"
                  type="text"
                  className="field-input"
                  value={form.skillsInput}
                  onChange={(e) => setForm((p) => ({ ...p, skillsInput: e.target.value }))}
                />
              </FormField>

              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Verified Links
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <input
                    type="url"
                    className="field-input"
                    placeholder="GitHub URL (https://github.com/...)"
                    value={form.github}
                    onChange={(e) => setForm((p) => ({ ...p, github: e.target.value }))}
                  />
                  <input
                    type="url"
                    className="field-input"
                    placeholder="LinkedIn URL (https://linkedin.com/in/...)"
                    value={form.linkedin}
                    onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
                  />
                  <input
                    type="url"
                    className="field-input"
                    placeholder="Personal Website (https://...)"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" loading={saving} style={{ width: '100%', justifyContent: 'center' }}>
                Save Portfolio
              </Button>
            </form>
          </div>
        )}

        {/* Live Preview / Public Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isEditorMode && (
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)' }}>
              Live Portfolio Card Preview
            </div>
          )}

          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Accent Strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, var(--accent), var(--cyan, #06b6d4))',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'var(--surface-hover)',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {(isEditorMode ? form.avatarUrl : profile.avatarUrl) ? (
                  <img
                    src={isEditorMode ? form.avatarUrl : profile.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                    {((isEditorMode ? form.displayName : profile.displayName) || profile.username || 'U')[0]}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-primary)' }}>
                  {(isEditorMode ? form.displayName : profile.displayName) || profile.username}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  @{profile.username}
                </div>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    color: tier.color,
                    border: `1px solid ${tier.color}44`,
                  }}
                >
                  {tier.name}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              {(isEditorMode ? form.bio : profile.bio) || 'No bio specified yet.'}
            </p>

            {/* Skills Chips */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Core Competencies
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {currentSkills.length > 0 ? (
                  currentSkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: '12px',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>No skills listed.</span>
                )}
              </div>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              {((isEditorMode ? form.github : profile.links?.github) || '') && (
                <a
                  href={isEditorMode ? form.github : profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  GitHub ↗
                </a>
              )}
              {((isEditorMode ? form.linkedin : profile.links?.linkedin) || '') && (
                <a
                  href={isEditorMode ? form.linkedin : profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  LinkedIn ↗
                </a>
              )}
              {((isEditorMode ? form.website : profile.links?.website) || '') && (
                <a
                  href={isEditorMode ? form.website : profile.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Website ↗
                </a>
              )}
            </div>
          </div>

          {/* Published Projects Showcase */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary)' }}>
              Projects by @{profile.username} ({projects.length})
            </h3>
            {projects.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {projects.map((p) => (
                  <ProjectCard key={p._id || p.id} project={p} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '28px', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
                  No projects published in this portfolio yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
