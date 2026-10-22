import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSeedProjectById, getSeedAuthor, getRelatedProjects, validateUrlProtocol } from '../data/seedProjects';
import ProjectCard from '../components/ui/ProjectCard';
import EmptyState from '../components/ui/EmptyState';
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
 * Project Detail page displaying complete metadata, author info,
 * validated external links, supported interactions, and related projects.
 */
export default function ProjectDetailPage() {
  const { id } = useParams();

  // Local interaction state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Retrieve project from temporary seed repository
  const project = useMemo(() => getSeedProjectById(id), [id]);

  // Retrieve author info and related projects
  const author = useMemo(() => project ? getSeedAuthor(project.author) : null, [project]);
  const relatedProjects = useMemo(() => project ? getRelatedProjects(project.id, 3) : [], [project]);

  // Graceful not-found state for unknown or missing project ID
  if (!project) {
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

  // Calculate gradient and formatted numbers
  const gradient = typeof project.gradient === 'number'
    ? TECH_GRADIENTS[project.gradient % TECH_GRADIENTS.length]
    : project.gradient || TECH_GRADIENTS[0];

  const likesCount = liked ? project.likes + 1 : project.likes;
  const viewsCount = typeof project.views === 'number' ? project.views.toLocaleString() : project.views;

  // External Links validation
  const rawGithubUrl = project.githubUrl || `https://github.com/${project.author || 'devverse'}/${project.id}`;
  const safeGithubUrl = validateUrlProtocol(rawGithubUrl);

  const rawDemoUrl = project.demoUrl || `https://${project.id}.devverse.app`;
  const safeDemoUrl = validateUrlProtocol(rawDemoUrl);

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
                  ID: {project.id}
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
                  {author.name.charAt(0)}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {author.name}
                </div>
                <Link
                  to="/profile"
                  style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
                >
                  @{author.handle}
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Like Button */}
              <button
                type="button"
                className={`btn btn-ghost ${liked ? 'liked' : ''}`}
                onClick={() => setLiked((prev) => !prev)}
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
                onClick={() => setBookmarked((prev) => !prev)}
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

              {/* Safe Validated Repository Link */}
              {safeGithubUrl && (
                <a
                  href={safeGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  aria-label={`View ${project.title} on GitHub (opens in new tab)`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55v-2c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.08.78 2.17v3.22c0 .3.21.65.8.55A11.51 11.51 0 0023.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
                  </svg>
                  <span>Repository ↗</span>
                </a>
              )}

              {/* Safe Validated Live Demo Link */}
              {safeDemoUrl && (
                <a
                  href={safeDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  aria-label={`Open live demo for ${project.title} (opens in new tab)`}
                >
                  <span>Live Demo ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="detail-grid detail-grid--wide">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Overview Section */}
            <section className="glass" style={{ padding: '28px' }}>
              <div className="eyebrow">Overview</div>
              <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '14px' }}>
                {project.desc}
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                This build focuses on real-world performance under load, a clean developer experience, and interface details most teams skip. It is actively maintained by {author.name} and open for community contributions.
              </p>
            </section>

            {/* Features Section */}
            <section className="glass" style={{ padding: '28px' }}>
              <div className="eyebrow">Key Architecture & Features</div>
              <div className="grid grid-2" style={{ gap: '14px' }}>
                {DEFAULT_FEATURES.map((feature, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.5" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar Info */}
          <aside className="sticky-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Technology Stack */}
            <div className="glass" style={{ padding: '22px' }}>
              <div className="eyebrow">Technology Stack</div>
              <div className="pc-tags" style={{ marginTop: '8px' }}>
                {project.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics & Metadata */}
            <div className="glass" style={{ padding: '22px' }}>
              <div className="eyebrow">Project Stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
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
                {author.bio || `${author.name} is a software engineer building modern applications on DevVerse.`}
              </p>
              {author.skills && (
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
