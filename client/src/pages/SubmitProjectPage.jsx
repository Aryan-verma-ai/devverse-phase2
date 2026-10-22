import React, { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
 * and transparent session-scoped storage disclosure.
 */
export default function SubmitProjectPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  // Available categories from seed
  const categories = getSeedCategories();

  // Published projects in current session
  const [myProjects, setMyProjects] = useState(() => getUserSubmittedProjects());

  // Input change handler
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on edit
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validation function
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

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const newProject = addTemporaryProject({
        title: form.title,
        desc: form.desc,
        category: form.category,
        difficulty: form.difficulty,
        tags: form.tags,
        features: form.features,
        githubUrl: form.githubUrl,
        demoUrl: form.demoUrl,
        author: 'you',
      });

      // Update session published list
      setMyProjects(getUserSubmittedProjects());

      // Show honest success feedback
      setSuccessInfo({
        id: newProject.id,
        title: newProject.title,
      });

      // Reset form fields so the user can enter another or modify
      setForm(INITIAL_FORM);
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-project-page-wrap" style={{ paddingBottom: '90px' }}>
      <section className="wrap page-header" style={{ padding: '40px 24px 28px' }}>
        <div className="eyebrow">Show your work</div>
        <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', marginBottom: '8px' }}>
          Submit a Project
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
          Publish something you have built to Explore. Fill in the details below to showcase your architecture, tools, and live demo.
        </p>
      </section>

      <section className="wrap" style={{ maxWidth: '820px', padding: '0 24px' }}>
        {/* Transparent Storage Disclosure Banner */}
        <StatusMessage
          type="info"
          title="Notice: Client-Side Demo Storage"
          message="Projects submitted here are added to temporary memory for this browser session. Server-side MongoDB persistence and multi-user synchronization are scheduled for Phase E."
        />

        {/* Success Alert */}
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

        {/* Main Controlled Form */}
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
            helperText="List primary languages, frameworks, or tools (comma-separated)."
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
            placeholder="https://github.com/owner/repository"
            error={errors.githubUrl}
            helperText="Must be a valid URL starting with https:// or http://"
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

          {/* Submit Action */}
          <div style={{ marginTop: '28px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full"
              style={{ width: '100%' }}
            >
              Publish to Explore (+25 pts)
            </Button>
          </div>
        </form>

        {/* User's Published Projects This Session */}
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
