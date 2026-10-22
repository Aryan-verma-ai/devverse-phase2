/**
 * DEVVERSE — Developer Profile Page
 *
 * Grounded in Phase 1 profile.html.
 * Supports:
 *   - Public profile view of any developer via query param ?u=<username> or URL param.
 *   - Authenticated view of the current user's profile with inline editing.
 *   - Strict field allowlisting (displayName, bio, avatarUrl, skills, links).
 *   - Displays authored projects fetched from MongoDB.
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

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const { username: paramUsername } = useParams();
  const { user: authUser, refreshUser } = useAuth();

  // Target username: URL param -> query param ?u= -> current user's username
  const targetUsername = paramUsername || searchParams.get('u') || authUser?.username;
  const isSelf = authUser && targetUsername && authUser.username.toLowerCase() === targetUsername.toLowerCase();

  const [profileData, setProfileData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    skills: '',
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!targetUsername) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      setSaveSuccess(null);

      try {
        const res = await userService.getPublicProfile(targetUsername);
        if (isMounted) {
          setProfileData(res.user);
          setProjects(res.projects || []);

          // Initialize edit form
          setEditForm({
            displayName: res.user.displayName || '',
            bio: res.user.bio || '',
            avatarUrl: res.user.avatarUrl || '',
            skills: Array.isArray(res.user.skills) ? res.user.skills.join(', ') : '',
            github: res.user.links?.github || '',
            linkedin: res.user.links?.linkedin || '',
            twitter: res.user.links?.twitter || '',
            website: res.user.links?.website || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || `Failed to load profile for @${targetUsername}.`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [targetUsername]);

  async function handleSave(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    const skillsArray = editForm.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      displayName: editForm.displayName.trim(),
      bio: editForm.bio.trim(),
      avatarUrl: editForm.avatarUrl.trim(),
      skills: skillsArray,
      links: {
        github: editForm.github.trim(),
        linkedin: editForm.linkedin.trim(),
        twitter: editForm.twitter.trim(),
        website: editForm.website.trim(),
      },
    };

    try {
      const updatedUser = await userService.updateProfile(payload);
      setProfileData((prev) => ({ ...prev, ...updatedUser }));
      if (isSelf && refreshUser) {
        await refreshUser();
      }
      setSaveSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/profile?u=${encodeURIComponent(targetUsername)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
        <LoadingState message={`Loading developer profile for @${targetUsername || 'you'}...`} />
      </div>
    );
  }

  if (!targetUsername) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px' }}>
        <EmptyState
          title="Sign in to view your profile"
          message="Please sign in to view and edit your profile, or specify a username in the URL."
          actionLabel="Go to Sign In"
          onAction={() => window.location.assign('/login')}
        />
      </div>
    );
  }

  if (fetchError || !profileData) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px' }}>
        <EmptyState
          title="Developer Profile Not Found"
          message={fetchError || `We couldn't locate any user account for @${targetUsername}.`}
          actionLabel="Explore Community"
          onAction={() => window.location.assign('/explore')}
        />
      </div>
    );
  }

  const tier = getTier(profileData.points || 0);

  return (
    <div style={{ maxWidth: '960px', margin: '24px auto', padding: '0 20px 80px' }}>
      {/* Notifications */}
      {saveSuccess && (
        <div style={{ marginBottom: '18px' }}>
          <StatusMessage type="success" message={saveSuccess} onDismiss={() => setSaveSuccess(null)} />
        </div>
      )}
      {saveError && (
        <div style={{ marginBottom: '18px' }}>
          <StatusMessage type="error" message={saveError} onDismiss={() => setSaveError(null)} />
        </div>
      )}

      {/* Hero Header Card */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Cover Gradient */}
        <div
          style={{
            height: '140px',
            background: 'linear-gradient(135deg, var(--accent) 0%, rgba(124, 111, 255, 0.4) 60%, var(--surface) 100%)',
          }}
        />

        {/* Profile Info Bar */}
        <div style={{ padding: '0 28px 24px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '-50px',
              marginBottom: '16px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '4px solid var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
              }}
            >
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--accent)',
                    color: 'var(--on-accent)',
                    fontSize: '36px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  {(profileData.displayName || profileData.username || 'U')[0]}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                {copiedLink ? 'Copied URL ✓' : 'Share Profile'}
              </Button>
              <Link to={`/portfolio?u=${encodeURIComponent(profileData.username)}`}>
                <Button variant="secondary" size="sm">
                  View Portfolio
                </Button>
              </Link>
              {isSelf && (
                <Button
                  variant={isEditing ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => setIsEditing((prev) => !prev)}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              )}
            </div>
          </div>

          {/* Names and Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {profileData.displayName}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background: 'var(--surface-hover)',
                  color: tier.color,
                  border: `1px solid ${tier.color}44`,
                }}
              >
                {tier.name} · {profileData.points || 0} pts
              </span>
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              @{profileData.username}
            </div>
          </div>

          {/* Bio */}
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: '70ch' }}>
            {profileData.bio || 'No developer bio written yet.'}
          </p>

          {/* Skills */}
          {Array.isArray(profileData.skills) && profileData.skills.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Skills & Technologies
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {profileData.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '12.5px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {profileData.links && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              {profileData.links.github && (
                <a
                  href={profileData.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  GitHub ↗
                </a>
              )}
              {profileData.links.linkedin && (
                <a
                  href={profileData.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  LinkedIn ↗
                </a>
              )}
              {profileData.links.twitter && (
                <a
                  href={profileData.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Twitter/X ↗
                </a>
              )}
              {profileData.links.website && (
                <a
                  href={profileData.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Website ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline Edit Form Panel */}
      {isSelf && isEditing && (
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Edit Profile Details
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FormField id="edit-display-name" label="Display Name" required>
                <input
                  id="edit-display-name"
                  type="text"
                  className="field-input"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
                  required
                />
              </FormField>

              <FormField id="edit-avatar-url" label="Avatar URL" hint="Optional http/https image link">
                <input
                  id="edit-avatar-url"
                  type="url"
                  className="field-input"
                  placeholder="https://example.com/avatar.png"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                />
              </FormField>
            </div>

            <FormField id="edit-bio" label="Bio" hint="Max 500 characters">
              <textarea
                id="edit-bio"
                className="field-textarea"
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
              />
            </FormField>

            <FormField id="edit-skills" label="Skills & Technologies" hint="Comma-separated list (e.g. React, Go, Docker)">
              <input
                id="edit-skills"
                type="text"
                className="field-input"
                value={editForm.skills}
                onChange={(e) => setEditForm((p) => ({ ...p, skills: e.target.value }))}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <FormField id="edit-github" label="GitHub URL">
                <input
                  id="edit-github"
                  type="url"
                  className="field-input"
                  placeholder="https://github.com/..."
                  value={editForm.github}
                  onChange={(e) => setEditForm((p) => ({ ...p, github: e.target.value }))}
                />
              </FormField>

              <FormField id="edit-linkedin" label="LinkedIn URL">
                <input
                  id="edit-linkedin"
                  type="url"
                  className="field-input"
                  placeholder="https://linkedin.com/in/..."
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm((p) => ({ ...p, linkedin: e.target.value }))}
                />
              </FormField>

              <FormField id="edit-website" label="Website URL">
                <input
                  id="edit-website"
                  type="url"
                  className="field-input"
                  placeholder="https://yoursite.com"
                  value={editForm.website}
                  onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button type="submit" variant="primary" loading={saveLoading}>
                Save Changes
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Published Projects ({projects.length})
          </h2>
          {isSelf && (
            <Link to="/submit-project">
              <Button variant="ghost" size="sm">
                + Submit Project
              </Button>
            </Link>
          )}
        </div>

        {projects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {projects.map((proj) => (
              <ProjectCard key={proj._id || proj.id} project={proj} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px dashed var(--border)',
              background: 'var(--surface)',
            }}
          >
            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
              {isSelf
                ? "You haven't published any projects yet. Share your code with the DevVerse community!"
                : `@${profileData.username} hasn't published any projects yet.`}
            </p>
            {isSelf && (
              <Link to="/submit-project">
                <Button variant="primary" size="sm">
                  Publish Your First Project
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
