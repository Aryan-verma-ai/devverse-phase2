/**
 * DEVVERSE — Reply Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6: Community Discussions)
 *   - Prompt 26 scope: replies belong to a thread within a community
 *
 * Requirements:
 *   - Reference to Thread (required, indexed)
 *   - Reference to Community (required, indexed) — stored for efficient community-scoped queries
 *   - Reference to User/author (required, indexed)
 *   - Body: 1–2000 chars
 *   - Service layer verifies thread.community === reply's community before insert
 *   - toJSON strips __v
 */

import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: [true, 'Reply must reference a thread'],
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Reply must reference a community'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reply must have an author'],
      index: true,
    },
    body: {
      type: String,
      required: [true, 'Reply body is required'],
      trim: true,
      minlength: [1, 'Reply body must not be empty'],
      maxlength: [2000, 'Reply body cannot exceed 2000 characters'],
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

const Reply = mongoose.model('Reply', replySchema);

export default Reply;
