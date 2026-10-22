/**
 * DEVVERSE — Project Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6)
 *   - docs/MODEL-DESIGN-REVIEW.md
 *   - client/src/pages/SubmitProjectPage.jsx
 *   - client/src/data/seedProjects.js
 *
 * Requirements:
 *   - Validated categories matching the 9 UI categories.
 *   - Validated difficulty enum ('Beginner', 'Intermediate', 'Advanced').
 *   - Validated URL protocols (http/https).
 *   - Owner reference pointing to 'User' model.
 *   - Safe serialization (strips __v).
 *   - Compound & text indexes for catalog filtering and search.
 */

import mongoose from 'mongoose';

export const PROJECT_CATEGORIES = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Mobile',
  'AI/ML',
  'DevOps',
  'Systems',
  'Web3',
  'Graphics',
];

export const PROJECT_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Project title must be at least 3 characters long'],
      maxlength: [120, 'Project title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [20, 'Project description must be at least 20 characters long'],
      maxlength: [2000, 'Project description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: PROJECT_CATEGORIES,
        message: '{VALUE} is not a valid project category',
      },
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: PROJECT_DIFFICULTIES,
        message: '{VALUE} is not a valid difficulty level',
      },
      default: 'Intermediate',
      index: true,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    githubUrl: {
      type: String,
      trim: true,
      default: '',
      match: [
        /^$|^https?:\/\/.+/,
        'GitHub repository URL must start with http:// or https://',
      ],
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
      match: [
        /^$|^https?:\/\/.+/,
        'Demo URL must start with http:// or https://',
      ],
    },
    timeline: [
      {
        hash: { type: String, default: '', trim: true },
        message: { type: String, default: '', trim: true },
        date: { type: String, default: '', trim: true },
      },
    ],
    art: {
      type: String,
      default: 'project-1.png',
      trim: true,
    },
    gradient: {
      type: Number,
      default: 0,
      min: [0, 'Gradient index must be between 0 and 4'],
      max: [4, 'Gradient index must be between 0 and 4'],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: [0, 'Likes count cannot be negative'],
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: [0, 'Views count cannot be negative'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have an owner reference'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for catalog querying (Category + Difficulty + Newest)
projectSchema.index({ category: 1, difficulty: 1, createdAt: -1 });

// Text index for search functionality
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

const Project = mongoose.model('Project', projectSchema);

export default Project;
