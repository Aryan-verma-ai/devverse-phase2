/**
 * DEVVERSE — GitHub Repository Import Service
 *
 * Uses the public GitHub REST API (no token required for public repos).
 * No client secrets are embedded here — the API calls go directly to
 * api.github.com using the unauthenticated rate limit (60 req/hour per IP).
 *
 * Responsibilities:
 *  - Parse and validate a GitHub repo URL
 *  - Fetch public repo metadata (name, description, language, star count)
 *  - Fetch the five most recent commits for optional timeline data
 *  - Return a normalised result object or a typed error
 *
 * This module is intentionally side-effect-free: it does NOT write to any
 * module-level state; callers own the state update.
 */

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

/**
 * Parse a GitHub repository URL into { owner, repo } or return null.
 * Accepts:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/
 *   https://github.com/owner/repo/tree/main
 *   http://github.com/owner/repo
 *   github.com/owner/repo  (no protocol)
 *
 * @param {string} raw
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGithubRepoUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  // Normalise: add https:// if the user typed "github.com/…"
  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  if (url.hostname !== 'github.com') return null;

  // pathname looks like /owner/repo[/anything-else]
  const parts = url.pathname.replace(/^\//, '').split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, ''); // strip .git suffix

  if (!owner || !repo) return null;

  return { owner, repo };
}

// ---------------------------------------------------------------------------
// Relative time helper (mirrors Phase 1 logic)
// ---------------------------------------------------------------------------

/**
 * Convert a UTC date string to a short human-readable relative string.
 * @param {string} dateStr  ISO 8601 date string
 * @returns {string}
 */
function relativeTime(dateStr) {
  const msAgo = Date.now() - new Date(dateStr).getTime();
  const daysAgo = Math.floor(msAgo / 86_400_000);

  if (daysAgo <= 0) return 'just now';
  if (daysAgo < 7) return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
  if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (daysAgo < 365) {
    const months = Math.floor(daysAgo / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(daysAgo / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export const IMPORT_ERROR = Object.freeze({
  INVALID_URL: 'INVALID_URL',
  NOT_FOUND: 'NOT_FOUND',
  PRIVATE_REPO: 'PRIVATE_REPO',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Human-readable messages for each error type.
 * @param {string} errorCode  One of IMPORT_ERROR values
 * @returns {string}
 */
export function importErrorMessage(errorCode) {
  switch (errorCode) {
    case IMPORT_ERROR.INVALID_URL:
      return "That doesn't look like a GitHub repo URL — try https://github.com/owner/repo, or fill the form in by hand.";
    case IMPORT_ERROR.NOT_FOUND:
      return 'Repository not found. Check the URL and make sure the repo is public.';
    case IMPORT_ERROR.PRIVATE_REPO:
      return 'This repository appears to be private. Only public repositories can be imported.';
    case IMPORT_ERROR.RATE_LIMITED:
      return "GitHub rate-limited this request (60 requests/hour for unauthenticated use). Wait a minute and try again, or fill the form in by hand.";
    case IMPORT_ERROR.NETWORK:
      return 'Network error reaching GitHub. Check your internet connection and try again.';
    default:
      return "Couldn't fetch that repository — it may be private, renamed, or GitHub may be temporarily unavailable. Fill the form in by hand.";
  }
}

// ---------------------------------------------------------------------------
// Main fetch function
// ---------------------------------------------------------------------------

/**
 * Fetch public repository metadata and recent commits from the GitHub API.
 *
 * @param {string} rawUrl  Raw user input (URL field value)
 * @returns {Promise<{
 *   ok: true,
 *   parsed: { owner: string, repo: string },
 *   repo: {
 *     fullName: string,
 *     name: string,
 *     description: string,
 *     language: string,
 *     stars: number,
 *     htmlUrl: string,
 *   },
 *   timeline: Array<{ label: string, when: string }>,
 * } | {
 *   ok: false,
 *   errorCode: string,
 * }>}
 */
export async function fetchGithubRepo(rawUrl) {
  // 1. Validate and parse the URL before any network call
  const parsed = parseGithubRepoUrl(rawUrl);
  if (!parsed) {
    return { ok: false, errorCode: IMPORT_ERROR.INVALID_URL };
  }

  const { owner, repo } = parsed;
  const API_BASE = `https://api.github.com/repos/${owner}/${repo}`;

  // 2. Fetch repository metadata
  let repoData;
  try {
    const res = await fetch(API_BASE, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (res.status === 404) return { ok: false, errorCode: IMPORT_ERROR.NOT_FOUND };
    if (res.status === 403 || res.status === 429) {
      // 403 with rate-limit headers, or 429 Too Many Requests
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining === '0' || res.status === 429) {
        return { ok: false, errorCode: IMPORT_ERROR.RATE_LIMITED };
      }
      // 403 for private repo
      return { ok: false, errorCode: IMPORT_ERROR.PRIVATE_REPO };
    }
    if (!res.ok) return { ok: false, errorCode: IMPORT_ERROR.UNKNOWN };

    repoData = await res.json();
  } catch {
    return { ok: false, errorCode: IMPORT_ERROR.NETWORK };
  }

  // 3. Fetch recent commits (non-fatal — if this fails, timeline is empty)
  let timeline = [];
  try {
    const commitsRes = await fetch(`${API_BASE}/commits?per_page=5`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (Array.isArray(commits)) {
        timeline = commits.map((c) => ({
          label: String(c?.commit?.message ?? '').split('\n')[0].trim(),
          when: relativeTime(c?.commit?.author?.date ?? ''),
        }));
      }
    }
    // If commits fetch fails, we continue with empty timeline — not a blocking error
  } catch {
    // Network error on commits — non-fatal
  }

  // 4. Normalise and return
  return {
    ok: true,
    parsed,
    repo: {
      fullName: String(repoData.full_name ?? `${owner}/${repo}`),
      name: String(repoData.name ?? repo),
      description: String(repoData.description ?? ''),
      language: String(repoData.language ?? ''),
      stars: Number(repoData.stargazers_count ?? 0),
      htmlUrl: String(repoData.html_url ?? `https://github.com/${owner}/${repo}`),
    },
    timeline,
  };
}
