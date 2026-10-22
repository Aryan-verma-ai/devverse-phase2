/**
 * DEVVERSE — TEMPORARY SEED / DEMO PROJECT DATA
 *
 * NOTE: This module contains static seed data derived from Phase 1.
 * It is used for frontend development and vertical slice testing before
 * backend and MongoDB persistence are connected (Phase E).
 * Do NOT treat this data as permanent or persistent across users.
 */

export const SEED_PROJECTS = Object.freeze([
  {
    id: 'p1',
    art: 'project-7.png',
    title: 'Nebula UI Kit',
    desc: 'A glassmorphic component library for ambitious dashboards.',
    tags: ['React', 'TypeScript', 'Framer Motion'],
    difficulty: 'Intermediate',
    likes: 842,
    views: 12400,
    category: 'Frontend',
    author: 'ari-devs',
    gradient: 0,
  },
  {
    id: 'p2',
    art: 'project-3.png',
    title: 'PulseDB',
    desc: 'A lightweight time-series database written for edge devices.',
    tags: ['Rust', 'WASM'],
    difficulty: 'Advanced',
    likes: 1290,
    views: 30100,
    category: 'Systems',
    author: 'kmori',
    gradient: 1,
  },
  {
    id: 'p3',
    art: 'project-9.png',
    title: 'Origami Auth',
    desc: 'Drop-in passwordless auth with WebAuthn and magic links.',
    tags: ['Node.js', 'Postgres'],
    difficulty: 'Intermediate',
    likes: 511,
    views: 8900,
    category: 'Backend',
    author: 'sena.codes',
    gradient: 2,
  },
  {
    id: 'p4',
    art: 'project-1.png',
    title: 'Voxel Garden',
    desc: 'A procedurally generated voxel world renderer in the browser.',
    tags: ['Three.js', 'WebGL'],
    difficulty: 'Advanced',
    likes: 2043,
    views: 51200,
    category: 'Graphics',
    author: 'lumen',
    gradient: 3,
  },
  {
    id: 'p5',
    art: 'project-8.png',
    title: 'Flowline',
    desc: 'A no-code workflow automation canvas for small teams.',
    tags: ['Vue', 'Node.js'],
    difficulty: 'Beginner',
    likes: 322,
    views: 6100,
    category: 'Frontend',
    author: 'priya.dev',
    gradient: 4,
  },
  {
    id: 'p6',
    art: 'project-4.png',
    title: 'Shard',
    desc: 'A distributed key-value store built for chaos testing.',
    tags: ['Go', 'gRPC'],
    difficulty: 'Advanced',
    likes: 987,
    views: 21300,
    category: 'Systems',
    author: 'kmori',
    gradient: 0,
  },
  {
    id: 'p7',
    art: 'project-6.png',
    title: 'Palette AI',
    desc: 'Generates accessible color systems from a single brand hex.',
    tags: ['Python', 'FastAPI'],
    difficulty: 'Intermediate',
    likes: 664,
    views: 14200,
    category: 'AI/ML',
    author: 'noa.ml',
    gradient: 1,
  },
  {
    id: 'p8',
    art: 'project-13.png',
    title: 'Driftboard',
    desc: 'A realtime kanban board with offline-first sync.',
    tags: ['Svelte', 'CRDT'],
    difficulty: 'Intermediate',
    likes: 455,
    views: 9800,
    category: 'Frontend',
    author: 'ari-devs',
    gradient: 2,
  },
  {
    id: 'p9',
    art: 'project-10.png',
    title: 'Kestrel CLI',
    desc: 'A blazing-fast scaffolding tool for monorepos.',
    tags: ['Rust', 'Clap'],
    difficulty: 'Beginner',
    likes: 210,
    views: 4300,
    category: 'Tools',
    author: 'dax',
    gradient: 3,
  },
  {
    id: 'p10',
    art: 'project-2.png',
    title: 'Mural',
    desc: 'Collaborative infinite canvas for design critique.',
    tags: ['Canvas API', 'WebSockets'],
    difficulty: 'Advanced',
    likes: 1544,
    views: 38700,
    category: 'Frontend',
    author: 'sena.codes',
    gradient: 4,
  },
  {
    id: 'p11',
    art: 'project-5.png',
    title: 'Cortex Notes',
    desc: 'A local-first note app with AI-assisted linking.',
    tags: ['Next.js', 'SQLite'],
    difficulty: 'Intermediate',
    likes: 733,
    views: 16800,
    category: 'AI/ML',
    author: 'noa.ml',
    gradient: 0,
  },
  {
    id: 'p12',
    art: 'project-11.png',
    title: 'Halcyon',
    desc: 'A minimalist static site generator with island hydration.',
    tags: ['TypeScript', 'esbuild'],
    difficulty: 'Beginner',
    likes: 388,
    views: 7200,
    category: 'Tools',
    author: 'dax',
    gradient: 1,
  },
  {
    id: 'p13',
    art: 'project-14.png',
    title: 'TaskFlow',
    desc: 'A collaborative task manager with boards, due dates, and live status updates for small teams.',
    tags: ['JavaScript', 'DOM', 'REST API'],
    difficulty: 'Beginner',
    likes: 356,
    views: 7600,
    category: 'Web Application',
    author: 'devon.codes',
    gradient: 2,
  },
  {
    id: 'p14',
    art: 'project-12.png',
    title: 'Ledgerly',
    desc: 'A browser-based invoicing and expense tracker for freelancers, with data saved locally.',
    tags: ['JavaScript', 'LocalStorage', 'Fetch API'],
    difficulty: 'Beginner',
    likes: 214,
    views: 5100,
    category: 'Web Application',
    author: 'priya.dev',
    gradient: 4,
  },
  {
    id: 'p15',
    art: 'project-15.png',
    title: 'ScoutBoard',
    desc: 'A job-application tracker web app — log postings, follow-ups, and interview stages in one board.',
    tags: ['JavaScript', 'Forms', 'JSON'],
    difficulty: 'Intermediate',
    likes: 297,
    views: 6400,
    category: 'Web Application',
    author: 'devon.codes',
    gradient: 3,
  },
]);

// Temporary in-memory storage for projects submitted in the current client session
const userSubmittedProjects = [];

/**
 * Returns a copy of the canonical seed projects combined with any session-submitted projects.
 * @returns {Array} Array of project objects
 */
export function getSeedProjects() {
  return [...userSubmittedProjects, ...SEED_PROJECTS];
}

/**
 * Retrieves a single project by ID (checks session projects first, then canonical seed).
 * @param {string} id
 * @returns {Object|null}
 */
export function getSeedProjectById(id) {
  return (
    userSubmittedProjects.find((p) => p.id === id) ||
    SEED_PROJECTS.find((p) => p.id === id) ||
    null
  );
}

/**
 * Adds a new user project to the temporary in-memory session list.
 * @param {Object} data
 * @returns {Object} Newly created project
 */
export function addTemporaryProject(data) {
  const newId = `user-${Date.now()}`;
  const newProject = {
    id: newId,
    art: data.art || 'project-14.png',
    title: data.title.trim(),
    desc: data.desc.trim(),
    tags: Array.isArray(data.tags)
      ? data.tags
      : data.tags.split(',').map((t) => t.trim()).filter(Boolean),
    features: Array.isArray(data.features)
      ? data.features
      : (data.features ? data.features.split(',').map((f) => f.trim()).filter(Boolean) : []),
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    category: data.category || 'Web Application',
    difficulty: data.difficulty || 'Intermediate',
    likes: 0,
    views: 1,
    author: data.author || 'you',
    gradient: typeof data.gradient === 'number' ? data.gradient : Math.floor(Math.random() * 5),
    githubUrl: data.githubUrl ? data.githubUrl.trim() : '',
    demoUrl: data.demoUrl ? data.demoUrl.trim() : '',
    isTemporary: true,
  };

  userSubmittedProjects.unshift(newProject);
  return newProject;
}


/**
 * Returns list of projects submitted by the user in this session.
 * @returns {Array}
 */
export function getUserSubmittedProjects() {
  return [...userSubmittedProjects];
}

/**
 * Returns unique category names from seed projects.
 * @returns {string[]}
 */
export function getSeedCategories() {
  const cats = new Set(SEED_PROJECTS.map((p) => p.category));
  return Array.from(cats).sort();
}

/**
 * Pure, deterministic filter and sort function.
 * Does NOT mutate the input array.
 *
 * @param {Array} projects - List of projects to filter
 * @param {Object} criteria
 * @param {string} [criteria.search=''] - Keyword search across title, desc, and tags
 * @param {string} [criteria.category='All'] - Category filter
 * @param {string} [criteria.difficulty='All'] - Difficulty filter
 * @param {'trending' | 'likes' | 'views' | 'newest'} [criteria.sort='trending']
 * @returns {Array} New filtered and sorted array
 */
export function filterAndSortProjects(projects, {
  search = '',
  category = 'All',
  difficulty = 'All',
  sort = 'trending',
} = {}) {
  const query = search.trim().toLowerCase();

  // 1. Filter (creates new array)
  const filtered = projects.filter((p) => {
    const matchSearch = !query || (
      p.title.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query) ||
      (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(query)))
    );

    const matchCategory = category === 'All' || p.category.toLowerCase() === category.toLowerCase();
    const matchDifficulty = difficulty === 'All' || p.difficulty.toLowerCase() === difficulty.toLowerCase();

    return matchSearch && matchCategory && matchDifficulty;
  });

  // 2. Sort (creates a fresh shallow copy so input is never mutated)
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'likes':
        return b.likes - a.likes;
      case 'views':
        return b.views - a.views;
      case 'newest': {
        // For canonical IDs like p1–p15, sort by numeric suffix descending.
        // For session-submitted IDs like user-{timestamp}, they sort before
        // canonical projects because their numeric parse is NaN — we treat
        // NaN as Infinity (i.e., always "newer" than canonical projects).
        const numA = parseInt(a.id.replace(/^p/, ''), 10);
        const numB = parseInt(b.id.replace(/^p/, ''), 10);
        const valA = isNaN(numA) ? Infinity : numA;
        const valB = isNaN(numB) ? Infinity : numB;
        if (valA !== valB) return valB - valA;
        // Tie-break by string comparison for stability
        return b.id.localeCompare(a.id);
      }

      case 'trending':
      default: {
        const scoreA = a.likes + (a.views / 10);
        const scoreB = b.likes + (b.views / 10);
        return scoreB - scoreA;
      }
    }
  });
}

export const SEED_DEVS = Object.freeze([
  { handle: 'kmori', name: 'Kenji Mori', avatarSeed: 'kmori', followers: 4820, projects: 14, points: 9840, bio: 'Systems engineer obsessed with latency. Building databases that refuse to fall over.', skills: ['Rust', 'Go', 'Distributed Systems'] },
  { handle: 'ari-devs', name: 'Ari Solano', avatarSeed: 'arisolano', followers: 3110, projects: 9, points: 7420, bio: 'Frontend architect. If it doesn\'t feel alive, it isn\'t shipping.', skills: ['React', 'TypeScript', 'Motion Design'] },
  { handle: 'sena.codes', name: 'Sena Park', avatarSeed: 'senapark', followers: 5980, projects: 17, points: 11230, bio: 'Full-stack builder shipping realtime tools for teams that hate meetings.', skills: ['Node.js', 'Vue', 'CRDT'] },
  { handle: 'lumen', name: 'Lumen Cross', avatarSeed: 'lumencross', followers: 8340, projects: 6, points: 15600, bio: 'Graphics programmer. I make the browser do things it was never asked to do.', skills: ['WebGL', 'Three.js', 'Shaders'] },
  { handle: 'noa.ml', name: 'Noa Reyes', avatarSeed: 'noareyes', followers: 2760, projects: 11, points: 6510, bio: 'ML engineer turning research papers into tools people actually use.', skills: ['Python', 'PyTorch', 'FastAPI'] },
  { handle: 'priya.dev', name: 'Priya Nair', avatarSeed: 'priyanair', followers: 1980, projects: 8, points: 4310, bio: 'Building calm software for busy teams.', skills: ['Vue', 'Node.js', 'Design Systems'] },
  { handle: 'dax', name: 'Dax Whitfield', avatarSeed: 'daxwhitfield', followers: 1420, projects: 5, points: 3020, bio: 'Tooling nerd. I build the things that build the things.', skills: ['Rust', 'CLI', 'DX'] },
  { handle: 'devon.codes', name: 'Devon Blake', avatarSeed: 'devonblake', followers: 2210, projects: 7, points: 5230, bio: 'Web app builder. I like turning a messy spreadsheet workflow into something people actually enjoy opening.', skills: ['JavaScript', 'DOM', 'REST API'] },
]);

/**
 * Returns author profile info for a handle.
 * @param {string} handle
 * @returns {Object}
 */
export function getSeedAuthor(handle) {
  if (!handle) return { name: 'DevVerse Builder', handle: 'builder', avatarSeed: 'dev' };
  const found = SEED_DEVS.find((d) => d.handle.toLowerCase() === handle.toLowerCase());
  return found || { name: handle, handle, avatarSeed: handle };
}

/**
 * Retrieves related projects in the same category or backfilled with top projects.
 * @param {string} currentProjectId
 * @param {number} [count=3]
 * @returns {Array}
 */
export function getRelatedProjects(currentProjectId, count = 3) {
  const current = getSeedProjectById(currentProjectId);
  if (!current) return [];

  const sameCategory = SEED_PROJECTS.filter(
    (p) => p.category === current.category && p.id !== currentProjectId
  );

  if (sameCategory.length >= count) {
    return sameCategory.slice(0, count);
  }

  const includedIds = new Set([currentProjectId, ...sameCategory.map((p) => p.id)]);
  const backfill = [...SEED_PROJECTS]
    .filter((p) => !includedIds.has(p.id))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, count - sameCategory.length);

  return [...sameCategory, ...backfill];
}

/**
 * Validates external URL protocols, ensuring only http: and https: are permitted.
 * Blocks dangerous schemes like javascript:, data:, vbscript:.
 * @param {string} url
 * @returns {string|null} Safe absolute URL or null if invalid/unsafe
 */
export function validateUrlProtocol(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Malformed URL string
  }
  return null;
}

