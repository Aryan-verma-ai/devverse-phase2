/**
 * DEVVERSE — Project Service
 *
 * Core domain and database operations for projects:
 *   - Bounded catalog querying with filtering, sorting, and pagination.
 *   - Fetching single project with safe public owner projection.
 *   - Creation with authenticated owner reference.
 *   - Server-enforced ownership checks for update and delete.
 */

import mongoose from 'mongoose';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

export const projectService = {
  /**
   * Retrieves a paginated and filtered list of projects.
   *
   * @param {Object} queryOptions
   * @param {string} [queryOptions.search]
   * @param {string} [queryOptions.category]
   * @param {string} [queryOptions.difficulty]
   * @param {string} [queryOptions.sort='newest']
   * @param {number|string} [queryOptions.page=1]
   * @param {number|string} [queryOptions.limit=20]
   * @returns {Promise<{ projects: Array, pagination: Object }>}
   */
  async listProjects({ search, category, difficulty, sort = 'newest', page = 1, limit = 20 } = {}) {
    const filter = {};

    // Category filter
    if (category && typeof category === 'string' && category.trim() && category !== 'All') {
      filter.category = category.trim();
    }

    // Difficulty filter
    if (difficulty && typeof difficulty === 'string' && difficulty.trim() && difficulty !== 'All') {
      filter.difficulty = difficulty.trim();
    }

    // Search query
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { technologies: regex },
      ];
    }

    // Sorting strategy
    let sortConfig = { createdAt: -1 };
    if (sort === 'trending' || sort === 'likes') {
      sortConfig = { likesCount: -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortConfig = { viewsCount: -1, createdAt: -1 };
    } else if (sort === 'newest') {
      sortConfig = { createdAt: -1 };
    }

    // Bounded pagination (protects against unbounded queries)
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'username displayName avatarUrl')
        .exec(),
    ]);

    return {
      projects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Retrieves a single project by ID with populated owner.
   *
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getProjectById(id) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const project = await Project.findById(id)
      .populate('owner', 'username displayName avatarUrl')
      .exec();

    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    return project;
  },

  /**
   * Creates a new project assigned to the provided owner ID.
   *
   * @param {Object} data
   * @param {mongoose.Types.ObjectId|string} ownerId
   * @returns {Promise<Object>}
   */
  async createProject(data, ownerId) {
    if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
      throw new AppError('A valid owner ID is required to create a project.', 400, 'INVALID_OWNER');
    }

    const project = await Project.create({
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty || 'Intermediate',
      technologies: data.technologies || [],
      features: data.features || [],
      githubUrl: data.githubUrl || '',
      demoUrl: data.demoUrl || '',
      timeline: data.timeline || [],
      art: data.art || 'project-1.png',
      gradient: data.gradient !== undefined ? data.gradient : 0,
      owner: ownerId,
    });

    return project.populate('owner', 'username displayName avatarUrl');
  },

  /**
   * Updates an existing project with server-enforced ownership check.
   *
   * @param {string} id
   * @param {Object} updates
   * @param {mongoose.Types.ObjectId|string} userId
   * @returns {Promise<Object>}
   */
  async updateProject(id, updates, userId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const project = await Project.findById(id);
    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    // Ownership check
    if (userId && !project.owner.equals(userId)) {
      throw new AppError('You do not have permission to edit this project.', 403, 'FORBIDDEN');
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'category',
      'difficulty',
      'technologies',
      'features',
      'githubUrl',
      'demoUrl',
      'timeline',
      'art',
      'gradient',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    }

    await project.save();
    return project.populate('owner', 'username displayName avatarUrl');
  },

  /**
   * Deletes a project with server-enforced ownership check.
   *
   * @param {string} id
   * @param {mongoose.Types.ObjectId|string} userId
   * @returns {Promise<{ id: string }>}
   */
  async deleteProject(id, userId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid project ID format.', 400, 'INVALID_ID');
    }

    const project = await Project.findById(id);
    if (!project) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    // Ownership check
    if (userId && !project.owner.equals(userId)) {
      throw new AppError('You do not have permission to delete this project.', 403, 'FORBIDDEN');
    }

    await project.deleteOne();
    return { id };
  },
};

export default projectService;
