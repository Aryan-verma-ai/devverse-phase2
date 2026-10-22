import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSeedProjectById, getSeedAuthor, getRelatedProjects, validateUrlProtocol } from '../data/seedProjects';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ui/ProjectCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusMessage from '../components/ui/StatusMessage';
import Button from '../components/ui/Button';

const TECH_GRADIENTS = [
  'linear-gradient(135deg, #7c6fff, #4fe3c1)',
  'linear-gradient(135deg, #ff6b5b, #7c6fff)',
  'linear-gradient(135deg, #4fe3c1, #ffb86b)',
  'linear-gradient(135deg, #ffb86b, #ff6b5b)',
  'linear-gradient(135deg, #7c6fff, #ff6b5b)',
];

const DEFAULT_FEATURES = [
  'Realtime state synchronization',
  'Offline-first client caching',
  'Zero-config setup and tooling',
  'Accessible and responsive by default',
];

/**
 * Project Detail page fetching live data from the API with loading,
 * not-found, and error states, while maintaining safe link protocol checks.
 */
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Project data & lifecycle state
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [interactionError, setInteractionError] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  const loadProject = async () => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    setInteractionError(null);

    try {
      // 1. Attempt API fetch
      const apiProject = await projectService.getProjectById(id);
      setProject(apiProject);
      setLiked(Boolean(apiProject?.liked));
      setBookmarked(Boolean(apiProject?.bookmarked));
      setLikesCount(apiProject?.likes ?? 0);
    } catch (err) {
      // If API reports 404 or INVALID_ID, check if it's a seed project ID (e.g. 'p1')
      if (err.status === 404 || err.code === 'NOT_FOUND' || err.code === 'INVALID_ID') {
        const seedFallback = getSeedProjectById(id);
        if (seedFallback) {
          setProject(seedFallback);
          setLiked(false);
          setBookmarked(false);
          setLikesCount(seedFallback.likes ?? 0);
          return;
        }
        setNotFound(true);
      } else {
        // Network / 500 failure
        setError(err.message || 'Unable to load project from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id, user]);

  const handleToggleLike = async () => {
    if (!user) {
      setInteractionError('Please sign in to like projects.');
      return;
    }
    if (interactionLoading) return;
    setInteractionLoading(true);
    setInteractionError(null);

    const prevLiked = liked;
    const prevCount = likesCount;

    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevLiked) {
        const res = await projectService.unlikeProject(id);
        setLiked(false);
        if (typeof res?.likesCount === 'number') {
          setLikesCount(res.likesCount);
        }
      } else {
        const res = await projectService.likeProject(id);
        setLiked(true);
        if (typeof res?.likesCount === 'number') {
          setLikesCount(res.likesCount);
        }
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      setInteractionError(err.message || 'Unable to update like status.');
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      setInteractionError('Please sign in to bookmark projects.');
      return;
    }
    if (interactionLoading) return;
    setInteractionLoading(true);
    setInteractionError(null);

    const prevBookmarked = bookmarked;
    setBookmarked(!prevBookmarked);

    try {
      if (prevBookmarked) {
        await projectService.unbookmarkProject(id);
        setBookmarked(false);
      } else {
        await projectService.bookmarkProject(id);
        setBookmarked(true);
      }
    } catch (err) {
      setBookmarked(prevBookmarked);
      setInteractionError(err.message || 'Unable to update bookmark status.');
    } finally {
      setInteractionLoading(false);
    }
  };

  // Retrieve author info and related projects
  const author = useMemo(() => {
    if (!project) return null;
    const authorHandle = project.owner?.username || project.author || 'devverse';
    const seedAuthor = getSeedAuthor(authorHandle);

    return {
      name: project.owner?.displayName || seedAuthor?.name || authorHandle,
      handle: authorHandle,
      bio: project.owner?.bio || seedAuthor?.bio || '',
      skills: project.owner?.skills || seedAuthor?.skills || project.tags || [],
    };
  }, [project]);

  const relatedProjects = useMemo(() => {
    if (!project) return [];
    return getRelatedProjects(project.id || project._id, 3);
  }, [project]);

  // Loading State
  if (loading) {
    return (
      <div className="wrap" style={{ padding: '60px 24px 100px' }}>
        <LoadingState label="Loading project details..." />
      </div>
    );
  }

  // Graceful not-found state for unknown or missing project ID
  if (notFound || (!loading && !error && !project)) {
    return (
      <div className="wrap" style={{ padding: '60px 24px 100px' }}>
        <EmptyState
          title="Project Not Found"
          description={`The requested project with ID "${id}" does not exist in our catalog or may have been removed.`}
          actionLabel="← Back to Explore Projects"
          actionLink="/explore"
        />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="wrap" style={{ padding: '60px 24px 100px' }}>
        <StatusMessage
          type="error"
          title="Failed to Load Project"
          message={error}
        >
          <div style={{ marginTop: '16px' }}>
            <Button type="button" variant="primary" size="sm" onClick={loadProject}>
              Retry Loading
            </Button>
          </div>
        </StatusMessage>
      </div>
    );
  }

  // Calculate gradient and formatted numbers
  const gradient = typeof project.gradient === 'number'
    ? TECH_GRADIENTS[project.gradient % TECH_GRADIENTS.length]
    : project.gradient || TECH_GRADIENTS[0];

  const viewsCount = typeof project.views === 'number' ? project.views.toLocaleString() : (project.views || '0');

  // External Links — only render when the project has explicit URLs set.
  // Do NOT fabricate URLs for projects that lack them.
  const safeGithubUrl = project.githubUrl ? validateUrlProtocol(project.githubUrl) : null;
  const safeDemoUrl = project.demoUrl ? validateUrlProtocol(project.demoUrl) : null;

  const handleShareClick = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2400);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="project-detail-wrap" style={{ paddingBottom: '90px' }}>
      <section className="wrap section-tight" style={{ paddingTop: '24px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/explore"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Explore
          </Link>
        </div>

        {/* Hero Banner Header */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '36px' }}>
          <div
            style={{
              height: '280px',
              background: gradient,
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '32px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 30%, rgba(7, 8, 12, 0.82))',
              }}
            />

            {project.art && (
              <img
                src={project.art.startsWith('http') || project.art.startsWith('/') ? project.art : `/assets/img/project-cards/${project.art}`}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '32px',
                  top: '24px',
                  height: '200px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45))',
                }}
              />
            )}

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  className="chip"
                  style={{ background: 'rgba(7, 8, 12, 0.6)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {project.category}
                </span>
                <span className="chip chip-accent">
                  {project.difficulty}
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  ID: {project.id || project._id}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.15 }}>
                {project.title}
              </h1>
            </div>
          </div>

          {/* Action Bar & Author Strip */}
          <div
            style={{
              padding: '24px 32px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '20px',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* Author Profile Information */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'conic-gradient(var(--violet), var(--cyan), var(--coral), var(--violet))',
                  padding: '2px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {author?.name ? author.name.charAt(0) : 'D'}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {author?.name}
                </div>
                <Link
                  to="/profile"
                  style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
                >
                  @{author?.handle}
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {interactionError && (
                <div style={{ width: '100%', marginBottom: '8px' }}>
                  <StatusMessage
                    type="error"
                    message={interactionError}
                    onDismiss={() => setInteractionError(null)}
                  />
                </div>
              )}
                {/* Like Button */}
                <button
                  type="button"
                  className={`btn btn-ghost ${liked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                  disabled={interactionLoading}
                  aria-label={`Like this project, currently ${likesCount} likes`}
                  style={{ color: liked ? 'var(--coral)' : undefined }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{likesCount.toLocaleString()}</span>
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  className={`btn btn-ghost ${bookmarked ? 'bookmarked' : ''}`}
                  onClick={handleToggleBookmark}
                  disabled={interactionLoading}
                  aria-label={`Bookmark ${project.title}`}
                  style={{ color: bookmarked ? 'var(--accent)' : undefined }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>

              {/* Share Button */}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleShareClick}
                aria-label="Share project link"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>{shareFeedback ? 'Copied URL!' : 'Share'}</span>
              </button>

              {/* External Links */}
              {safeGithubUrl && (
                <a
                  href={safeGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  aria-label={`View ${project.title} source on GitHub`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Repository</span>
                </a>
              )}

              {safeDemoUrl && (
                <a
                  href={safeDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  aria-label={`Open ${project.title} live demo`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '32px', alignItems: 'start' }}>
          {/* Main Description & Features */}
          <main>
            {/* Description Card */}
            <div className="glass" style={{ padding: '32px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Project Overview</h2>
              <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {project.desc || project.description}
              </p>
              {!project.isTemporary && (
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  This project was built to address common developer workflow bottlenecks by combining modern engineering practices with an intuitive user experience.
                </p>
              )}
            </div>

            {/* Key Features */}
            <div className="glass" style={{ padding: '32px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Key Capabilities</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {(project.features && project.features.length > 0 ? project.features : DEFAULT_FEATURES).map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline / Changelog (if imported from GitHub commits) */}
            {project.timeline && project.timeline.length > 0 && (
              <div className="glass" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Recent Development Timeline</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {project.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{item.message}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                        {item.hash?.substring(0, 7)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar Metadata */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Technologies */}
            <div className="glass" style={{ padding: '22px' }}>
              <div className="eyebrow">Built with</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {(project.tags || project.technologies || []).map((tech) => (
                  <span key={tech} className="chip">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Meta Info Card */}
            <div className="glass" style={{ padding: '22px' }}>
              <div className="eyebrow">Project Stats</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Category</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{project.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Difficulty</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{project.difficulty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Views</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{viewsCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Likes</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: liked ? 'var(--coral)' : undefined }}>
                    {likesCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Author Bio Card */}
            <div className="glass" style={{ padding: '22px' }}>
              <div className="eyebrow">About the Builder</div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: '8px' }}>
                {author?.bio || `${author?.name} is a software engineer building modern applications on DevVerse.`}
              </p>
              {author?.skills && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
                  {author.skills.map((skill) => (
                    <span key={skill} className="chip" style={{ fontSize: '11px' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related Projects Section */}
        {relatedProjects.length > 0 && (
          <section className="section-tight" style={{ marginTop: '48px' }}>
            <div className="section-head" style={{ marginBottom: '24px' }}>
              <div>
                <div className="eyebrow">Discover More</div>
                <h2>Related Projects in {project.category}</h2>
              </div>
              <Link to={`/explore?cat=${encodeURIComponent(project.category)}`} className="btn btn-ghost btn-sm">
                View all in {project.category} →
              </Link>
            </div>
            <div className="grid grid-3">
              {relatedProjects.map((rel) => (
                <ProjectCard
                  key={rel.id}
                  id={rel.id}
                  title={rel.title}
                  desc={rel.desc}
                  tags={rel.tags}
                  difficulty={rel.difficulty}
                  likes={rel.likes}
                  views={rel.views}
                  art={rel.art}
                  gradient={rel.gradient}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
