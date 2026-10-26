/**
 * DEVVERSE — Thread Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6: Community Discussions)
 *   - Prompt 26 scope: community threads with author, title, body, reply count
 *
 * Requirements:
 *   - Reference to Community (required, indexed)
 *   - Reference to User/author (required, indexed)
 *   - Title: 5–140 chars
 *   - Body: 10–5000 chars
 *   - Denormalized repliesCount (synced after reply writes)
 *   - toJSON strips __v; author populated with safe projection only
 */

import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Thread must belong to a community'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Thread must have an author'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      minlength: [5, 'Thread title must be at least 5 characters'],
      maxlength: [140, 'Thread title cannot exceed 140 characters'],
    },
    body: {
      type: String,
      required: [true, 'Thread body is required'],
      trim: true,
      minlength: [10, 'Thread body must be at least 10 characters'],
      maxlength: [5000, 'Thread body cannot exceed 5000 characters'],
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: [0, 'Replies count cannot be negative'],
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

const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
