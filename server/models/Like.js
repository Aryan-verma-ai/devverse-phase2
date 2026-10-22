/**
 * DEVVERSE — Like Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6: Bookmark and Like)
 *   - ANTIGRAVITY-IMPLEMENTATION-BRIEF.md (Database relationship summary:
 *     "User has Bookmarks and Likes for Projects; unique (user, project) in each")
 *
 * Requirements:
 *   - Reference to User
 *   - Reference to Project
 *   - Compound unique index on (user, project) to prevent duplicate records
 *   - Timestamps for creation/update auditing
 */

import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Like must reference a valid user'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Like must reference a valid project'],
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

// Enforce unique (user, project) pair at the database engine level
likeSchema.index({ user: 1, project: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;
