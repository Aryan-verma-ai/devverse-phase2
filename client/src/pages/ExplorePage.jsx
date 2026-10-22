import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectCard from '../components/ui/ProjectCard';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { getSeedProjects, getSeedCategories, filterAndSortProjects } from '../data/seedProjects';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'trending', label: 'Sort: Trending' },
  { value: 'likes', label: 'Sort: Most liked' },
  { value: 'views', label: 'Sort: Most viewed' },
  { value: 'newest', label: 'Sort: Newest' },
];

/**
 * Explore Projects page displaying searchable, filterable, and sortable project cards.
 * Uses isolated seed data module with zero raw DOM injection sinks.
 */
export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Read initial category from query param (?cat=...)
  const initialCategory = searchParams.get('cat') || 'All';

  // Filter and sort state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState('All');
  const [sort, setSort] = useState('trending');

  // Interactive likes and bookmarks state (local interactive exploration)
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());

  // Canonical projects and derived categories
  const allProjects = useMemo(() => getSeedProjects(), []);
  const availableCategories = useMemo(() => ['All', ...getSeedCategories()], []);

  // Sync category changes with URL query parameter
  useEffect(() => {
    const urlCat = searchParams.get('cat');
    if (urlCat && urlCat !== category) {
      setCategory(urlCat);
    }
  }, [searchParams]);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update category handler with search param reflection
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'All') {
      searchParams.delete('cat');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ cat: newCat }, { replace: true });
    }
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setDifficulty('All');
    setSort('trending');
    searchParams.delete('cat');
    setSearchParams(searchParams, { replace: true });
  };

  const isFiltered = search.trim() !== '' || category !== 'All' || difficulty !== 'All' || sort !== 'trending';

  // Deterministic filtered and sorted project list
  const filteredProjects = useMemo(() => {
    return filterAndSortProjects(allProjects, {
      search,
      category,
      difficulty,
      sort,
    });
  }, [allProjects, search, category, difficulty, sort]);

  // Like & Bookmark toggle handlers
  const handleToggleLike = (e, projectId) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleToggleBookmark = (e, projectId) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

  return (
    <div className="explore-page-wrap" style={{ paddingBottom: '90px' }}>
      {/* Page Header */}
      <section className="wrap page-header" style={{ padding: '40px 24px 28px' }}>
        <div className="eyebrow">The Catalog</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', marginBottom: '8px' }}>
              Explore Projects
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
              Search, filter, and sort through everything the DevVerse community is building.
            </p>
          </div>
          <Button
            as="a"
            href="/submit-project"
            variant="primary"
            size="md"
          >
            + Submit a project
          </Button>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <section className="wrap" style={{ padding: '0 24px 24px' }}>
        <div
          className="glass"
          style={{
            padding: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Keyword Search Input */}
          <div className="search-wrap" style={{ flex: '1 1 260px', position: 'relative' }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-tertiary)' }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              id="explore-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, tags, or tech…"
              aria-label="Search projects by title, description, or technology tags"
              className="field-input"
              style={{ paddingLeft: '40px', paddingRight: search ? '60px' : '42px' }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search query"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            ) : (
              <kbd className="search-kbd" aria-hidden="true">
                /
              </kbd>
            )}
          </div>

          {/* Difficulty Toggle Pills */}
          <div className="pill-toggle" role="group" aria-label="Filter by difficulty">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                className={difficulty === diff ? 'active' : ''}
                onClick={() => setDifficulty(diff)}
                aria-pressed={difficulty === diff}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            id="explore-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort projects"
            className="field-select"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Chips */}
        <div
          id="category-filters"
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', alignItems: 'center' }}
          role="group"
          aria-label="Filter by category"
        >
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${cat === category ? 'chip-accent' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={cat === category}
              style={{ cursor: 'pointer' }}
            >
              {cat}
            </button>
          ))}

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Projects Grid / Count Strip */}
      <section className="wrap" style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
            {search.trim() && (
              <span> matching &ldquo;{search.trim()}&rdquo;</span>
            )}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--surface)', padding: '3px 8px', borderRadius: '4px' }}>
            Demo Data
          </span>
        </div>

        {/* Grid or Empty State */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-3" id="explore-grid">
            {filteredProjects.map((project) => {
              const isLiked = likedIds.has(project.id);
              const isBookmarked = bookmarkedIds.has(project.id);
              const displayedLikes = isLiked ? project.likes + 1 : project.likes;

              return (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  desc={project.desc}
                  tags={project.tags}
                  difficulty={project.difficulty}
                  likes={displayedLikes}
                  views={project.views}
                  art={project.art}
                  gradient={project.gradient}
                  liked={isLiked}
                  bookmarked={isBookmarked}
                  onLike={handleToggleLike}
                  onBookmark={handleToggleBookmark}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No matching projects found"
            description={
              search.trim()
                ? `No projects match "${search.trim()}" in the selected category and difficulty.`
                : 'No projects match the selected difficulty and category filters.'
            }
            actionLabel="Reset all filters"
            onAction={handleResetFilters}
          />
        )}
      </section>
    </div>
  );
}
