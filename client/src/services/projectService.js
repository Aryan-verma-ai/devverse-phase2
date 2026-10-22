/**
 * DEVVERSE — Project Service
 *
 * Client-side service layer communicating with the /api/projects REST endpoints.
 * Provides normalized project data for UI components.
 */

import apiClient from './apiClient.js';

/**
 * Normalizes project records so both MongoDB documents and legacy seed shapes
 * integrate seamlessly with ProjectCard and ProjectDetailPage.
 *
 * @param {Object} p
 * @returns {Object}
 */
export function normalizeProject(p) {
  if (!p) return null;

  return {
    id: p._id || p.id,
    _id: p._id || p.id,
    title: p.title || '',
    desc: p.description || p.desc || '',
    description: p.description || p.desc || '',
    category: p.category || 'Frontend',
    difficulty: p.difficulty || 'Intermediate',
    tags: Array.isArray(p.technologies) ? p.technologies : (Array.isArray(p.tags) ? p.tags : []),
    technologies: Array.isArray(p.technologies) ? p.technologies : (Array.isArray(p.tags) ? p.tags : []),
    features: Array.isArray(p.features) ? p.features : [],
    githubUrl: p.githubUrl || '',
    demoUrl: p.demoUrl || '',
    timeline: Array.isArray(p.timeline) ? p.timeline : [],
    art: p.art || 'project-1.png',
    gradient: typeof p.gradient === 'number' ? p.gradient : 0,
    likes: p.likesCount ?? p.likes ?? 0,
    views: p.viewsCount ?? p.views ?? 0,
    author: p.owner?.username || p.author || 'developer',
    owner: p.owner || { username: p.author || 'developer', displayName: p.author || 'Developer' },
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

export const projectService = {
  /**
   * Fetches projects with filtering, sorting, and pagination.
   *
   * @param {Object} [params={}]
   * @param {string} [params.search]
   * @param {string} [params.category]
   * @param {string} [params.difficulty]
   * @param {string} [params.sort]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<{ projects: Array, pagination: Object }>}
   */
  async getProjects(params = {}) {
    const res = await apiClient.get('/projects', { params });
    const rawProjects = res?.data || [];
    return {
      projects: rawProjects.map(normalizeProject),
      pagination: res?.pagination || { total: rawProjects.length, page: 1, limit: rawProjects.length, pages: 1 },
    };
  },

  /**
   * Fetches a single project by ID.
   *
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getProjectById(id) {
    const res = await apiClient.get(`/projects/${id}`);
    return normalizeProject(res?.data);
  },

  /**
   * Creates a new project.
   *
   * @param {Object} projectData
   * @returns {Promise<Object>}
   */
  async createProject(projectData) {
    const res = await apiClient.post('/projects', projectData);
    return normalizeProject(res?.data);
  },

  /**
   * Updates an existing project.
   *
   * @param {string} id
   * @param {Object} projectData
   * @returns {Promise<Object>}
   */
  async updateProject(id, projectData) {
    const res = await apiClient.patch(`/projects/${id}`, projectData);
    return normalizeProject(res?.data);
  },

  /**
   * Deletes a project by ID.
   *
   * @param {string} id
   * @returns {Promise<{ id: string }>}
   */
  async deleteProject(id) {
    const res = await apiClient.delete(`/projects/${id}`);
    return res?.data;
  },
};

export default projectService;
