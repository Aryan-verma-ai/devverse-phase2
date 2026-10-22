import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import StatusMessage from '../components/ui/StatusMessage';
import ProjectCard from '../components/ui/ProjectCard';
import {
  getSeedCategories,
  addTemporaryProject,
  getUserSubmittedProjects,
  validateUrlProtocol,
} from '../data/seedProjects';
import projectService from '../services/projectService';
import {
  fetchGithubRepo,
  parseGithubRepoUrl,
  importErrorMessage,
} from '../services/githubImport';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const INITIAL_FORM = {
  title: '',
  desc: '',
  category: 'Frontend',
  difficulty: 'Intermediate',
  tags: '',
  features: '',
  githubUrl: '',
  demoUrl: '',
};

/**
 * Submit Project Page with controlled inputs, client-side validation,
 * transparent session-scoped storage disclosure, and optional GitHub import.
 */
export default function SubmitProjectPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [apiError, setApiError] = useState(null);

  // GitHub import panel state
  const [ghUrl, setGhUrl] = useState('');
  const [ghStatus, setGhStatus] = useState(null); // { type: 'loading'|'success'|'error', message: string }
  const [importedTimeline, setImportedTimeline] = useState([]);
  const ghInputRef = useRef(null);

  // Available categories from seed
  const categories = getSeedCategories();

  // Published projects in current session
  const [myProjects, setMyProjects] = useState(() => getUserSubmittedProjects());

  // Input change handler — clears field-level error on edit
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // GitHub import
  // ---------------------------------------------------------------------------

  const handleGithubImport = async () => {
    if (!ghUrl.trim()) {
      setGhStatus({ type: 'error', message: "Paste a GitHub repository URL first — e.g. https://github.com/owner/repo" });
      ghInputRef.current?.focus();
      return;
    }

    setGhStatus({ type: 'loading', message: 'Fetching repository from GitHub…' });

    const result = await fetchGithubRepo(ghUrl);

    if (!result.ok) {
      setGhStatus({ type: 'error', message: importErrorMessage(result.errorCode) });
      return;
    }

    const { repo, timeline } = result;

    // Pre-fill editable form fields — user can edit any value before submitting
    setForm((prev) => ({
      ...prev,
      title: repo.name || prev.title,
      desc: repo.description || prev.desc,
      tags: repo.language || prev.tags,
      githubUrl: repo.htmlUrl || prev.githubUrl,
    }));

    // Store timeline for use during form submission
    setImportedTimeline(timeline);

    // Clear any existing field errors that might have been on imported fields
    setErrors((prev) => {
      const next = { ...prev };
      if (repo.name) delete next.title;
      if (repo.description) delete next.desc;
      if (repo.language) delete next.tags;
      return next;
    });

    const starLabel = repo.stars === 1 ? '1 star' : `${repo.stars.toLocaleString()} stars`;
    const commitLabel = timeline.length > 0
      ? ` • ${timeline.length} recent commit${timeline.length > 1 ? 's' : ''} imported for timeline`
      : ' • No commit history available';
    setGhStatus({
      type: 'success',
      message: `Imported ${repo.fullName} — ${starLabel}${commitLabel}. Review and edit any field before publishing.`,
    });
  };

  const handleGhKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGithubImport();
    }
  };

  const handleClearImport = () => {
    setGhUrl('');
    setGhStatus(null);
    setImportedTimeline([]);
    ghInputRef.current?.focus();
  };

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------

  const validate = () => {
    const errs = {};

    if (!form.title.trim()) {
      errs.title = 'Project title is required.';
    } else if (form.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }

    if (!form.desc.trim()) {
      errs.desc = 'Project description is required.';
    } else if (form.desc.trim().length < 20) {
      errs.desc = 'Description must be at least 20 characters explaining what it does.';
    }

    const parsedTags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (!form.tags.trim() || parsedTags.length === 0) {
      errs.tags = 'Provide at least one technology tag (comma-separated, e.g. React, Node.js).';
    }

    if (form.githubUrl.trim()) {
      const validGit = validateUrlProtocol(form.githubUrl);
      if (!validGit) {
        errs.githubUrl = 'Enter a valid URL starting with https:// or http://';
      }
    }

    if (form.demoUrl.trim()) {
      const validDemo = validateUrlProtocol(form.demoUrl);
      if (!validDemo) {
        errs.demoUrl = 'Enter a valid live demo URL starting with https:// or http://';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    const payload = {
      title: form.title.trim(),
      description: form.desc.trim(),
      category: form.category,
      difficulty: form.difficulty,
      technologies: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      features: form.features ? form.features.split('\n').map((f) => f.trim()).filter(Boolean) : [],
      githubUrl: form.githubUrl.trim(),
      demoUrl: form.demoUrl.trim(),
      timeline: importedTimeline,
    };

    try {
      // 1. Attempt live API submission
      const created = await projectService.createProject(payload);

      // Keep local session tracking in sync
      addTemporaryProject({
        id: created.id || created._id,
        ...payload,
        author: created.author || 'you',
      });

      setMyProjects(getUserSubmittedProjects());
      setSuccessInfo({ id: created.id || created._id, title: created.title });

      // Reset form
      setForm(INITIAL_FORM);
      setErrors({});
      setGhUrl('');
      setGhStatus(null);
      setImportedTimeline([]);
    } catch (err) {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          if (d.field === 'description') fieldErrors.desc = d.message;
          else fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      }
      setApiError(err.message || 'Failed to submit project to DevVerse API.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /** Inline status indicator inside the GitHub import panel */
  const renderGhStatus = () => {
    if (!ghStatus) return null;
    if (ghStatus.type === 'loading') {
      return (
        <p
          role="status"
          aria-live="polite"
          style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', fontFamily: 'monospace' }}
        >
          ⏳ {ghStatus.message}
        </p>
      );
    }
    if (ghStatus.type === 'success') {
      return (
        <p
          role="status"
          aria-live="polite"
          style={{ fontSize: '13px', color: 'var(--success, #4ade80)', marginTop: '10px' }}
        >
          ✓ {ghStatus.message}
        </p>
      );
    }
    // error
    return (
      <p
        role="alert"
        style={{ fontSize: '13px', color: 'var(--error, #f87171)', marginTop: '10px' }}
      >
        ✗ {ghStatus.message}
      </p>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="submit-project-page-wrap" style={{ paddingBottom: '90px' }}>
      <section className="wrap page-header" style={{ padding: '40px 24px 28px' }}>
        <div className="eyebrow">Show your work</div>
        <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', marginBottom: '8px' }}>
          Submit a Project
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
          Publish something you have built to Explore. Start from a GitHub repo URL to pre-fill the form,
          or fill everything in by hand — either way you review and edit before publishing.
        </p>
      </section>

      <section className="wrap" style={{ maxWidth: '820px', padding: '0 24px' }}>

        {/* Transparent Storage Disclosure Banner */}
        <StatusMessage
          type="info"
          title="Notice: Client-Side Demo Storage & Live MongoDB Persistence"
          message="Projects submitted here are persisted live to MongoDB via the DevVerse REST API. In offline mode, projects fall back to temporary memory for this browser session."
        />

        {/* ------------------------------------------------------------------ */}
        {/* GitHub Import Panel                                                  */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="glass"
          style={{ padding: '24px', marginBottom: '24px', borderRadius: 'var(--radius-lg)' }}
          aria-labelledby="gh-import-heading"
        >
          <h2 id="gh-import-heading" style={{ fontSize: '17px', marginBottom: '6px' }}>
            Import from GitHub <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Paste a <strong>public</strong> repository URL and we'll pull the name, description,
            and primary language from GitHub's API — you can edit everything before publishing.
            No token or login required; uses the unauthenticated rate limit (60 req/hr per IP).
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              ref={ghInputRef}
              id="gh-url-input"
              type="url"
              value={ghUrl}
              onChange={(e) => setGhUrl(e.target.value)}
              onKeyDown={handleGhKeyDown}
              placeholder="https://github.com/owner/repo"
              aria-label="GitHub repository URL"
              style={{ flex: '1', minWidth: '220px' }}
              disabled={ghStatus?.type === 'loading'}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleGithubImport}
              loading={ghStatus?.type === 'loading'}
              disabled={ghStatus?.type === 'loading'}
              aria-label="Fetch metadata from GitHub"
            >
              Fetch from GitHub
            </Button>
            {ghStatus && ghStatus.type !== 'loading' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearImport}
                aria-label="Clear GitHub import"
              >
                Clear
              </Button>
            )}
          </div>

          {renderGhStatus()}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Success Alert (after form submit)                                   */}
        {/* ------------------------------------------------------------------ */}
        {successInfo && (
          <StatusMessage
            type="success"
            title="Project Successfully Created!"
            message={
              <div>
                Published &ldquo;{successInfo.title}&rdquo; to your session catalog.{' '}
                <Link
                  to={`/projects/${successInfo.id}`}
                  style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
                >
                  View Project Detail Page →
                </Link>
              </div>
            }
            onDismiss={() => setSuccessInfo(null)}
          />
        )}

        {/* API Error Alert */}
        {apiError && (
          <div style={{ marginBottom: '24px' }}>
            <StatusMessage
              type="error"
              title="Project Submission Failed"
              message={apiError}
              onDismiss={() => setApiError(null)}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Main Controlled Form                                                 */}
        {/* ------------------------------------------------------------------ */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="glass"
          style={{ padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '40px' }}
          aria-label="Submit project form"
        >
          <h2 style={{ fontSize: '20px', marginBottom: '22px' }}>
            Project Information
          </h2>

          {/* Title */}
          <FormField
            id="sp-title"
            label="Project Title"
            required
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Nebula UI Kit, PulseDB"
            error={errors.title}
            helperText="Clear and descriptive name for your application."
          />

          {/* Description */}
          <FormField
            id="sp-desc"
            label="Description"
            as="textarea"
            required
            rows={4}
            value={form.desc}
            onChange={(e) => handleChange('desc', e.target.value)}
            placeholder="Describe what your project does, the technical problems it solves, and why you built it..."
            error={errors.desc}
            helperText="Minimum 20 characters. Summarize the core problem and developer experience."
          />

          {/* Category & Difficulty Grid */}
          <div className="grid grid-2" style={{ gap: '16px', marginBottom: '18px' }}>
            <FormField
              id="sp-category"
              label="Category"
              as="select"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FormField>

            <FormField
              id="sp-difficulty"
              label="Difficulty Level"
              as="select"
              value={form.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </FormField>
          </div>

          {/* Tech Stack / Tags */}
          <FormField
            id="sp-tags"
            label="Technology Stack / Tags"
            required
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="React, TypeScript, Framer Motion"
            error={errors.tags}
            helperText="List primary languages, frameworks, or tools (comma-separated). GitHub import pre-fills this with the primary language."
          />

          {/* Key Features */}
          <FormField
            id="sp-features"
            label="Key Features (Optional)"
            value={form.features}
            onChange={(e) => handleChange('features', e.target.value)}
            placeholder="Realtime sync, Offline cache, Zero-config"
            helperText="Highlight 2 to 4 notable capabilities (comma-separated)."
          />

          {/* External Repository URL */}
          <FormField
            id="sp-github"
            label="Repository URL (Optional)"
            type="url"
            value={form.githubUrl}
            onChange={(e) => handleChange('githubUrl', e.target.value)}
            placeholder="https://github.com/owner/repo"
            error={errors.githubUrl}
            helperText="Must be a valid URL starting with https:// or http:// — GitHub import pre-fills this automatically."
          />

          {/* Live Demo URL */}
          <FormField
            id="sp-demo"
            label="Live Demo URL (Optional)"
            type="url"
            value={form.demoUrl}
            onChange={(e) => handleChange('demoUrl', e.target.value)}
            placeholder="https://myproject.devverse.app"
            error={errors.demoUrl}
            helperText="Public link where users can test and explore your project."
          />

          {/* Imported Timeline Indicator */}
          {importedTimeline.length > 0 && (
            <div
              style={{
                background: 'var(--surface-2, rgba(255,255,255,0.04))',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: '18px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
              aria-live="polite"
            >
              <strong>Timeline attached:</strong> {importedTimeline.length} recent commit
              {importedTimeline.length > 1 ? 's' : ''} imported from GitHub will be included in the project detail view.
            </div>
          )}

          {/* Submit Action */}
          <div style={{ marginTop: '28px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              style={{ width: '100%' }}
            >
              Publish to Explore (+25 pts)
            </Button>
          </div>
        </form>

        {/* ------------------------------------------------------------------ */}
        {/* User's Published Projects This Session                              */}
        {/* ------------------------------------------------------------------ */}
        <section aria-labelledby="session-projects-heading">
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <div>
              <div className="eyebrow">Session Library</div>
              <h2 id="session-projects-heading" style={{ fontSize: '20px' }}>
                Your Published Projects ({myProjects.length})
              </h2>
            </div>
            {myProjects.length > 0 && (
              <Link to="/explore" className="btn btn-ghost btn-sm">
                View in Explore Catalog →
              </Link>
            )}
          </div>

          {myProjects.length > 0 ? (
            <div className="grid grid-2" style={{ gap: '20px' }}>
              {myProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  desc={p.desc}
                  tags={p.tags}
                  difficulty={p.difficulty}
                  likes={p.likes}
                  views={p.views}
                  art={p.art}
                  gradient={p.gradient}
                />
              ))}
            </div>
          ) : (
            <div className="glass" style={{ padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                No projects published in this session yet. Complete the form above to add your first project.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
