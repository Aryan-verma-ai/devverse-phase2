/**
 * DEVVERSE — Community Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6: Community)
 *   - Phase 1 js/data.js (DV_COMMUNITIES inventory: 6 technical guilds)
 *   - docs/FEATURE-PARITY.md
 *
 * Requirements:
 *   - Unique slug/id (e.g. 'c1', 'rustaceans-guild')
 *   - Name and description with validation
 *   - Gradient index (0-4 matching DevVerse tech gradients)
 *   - Tags for tech topics
 *   - Synchronized membersCount (grounded in CommunityMembership records)
 *   - Curated onlineCount
 *   - Timestamps and safe serialization
 */

import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Community slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, 'Slug must be at least 2 characters long'],
      maxlength: [60, 'Slug cannot exceed 60 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      minlength: [3, 'Community name must be at least 3 characters long'],
      maxlength: [80, 'Community name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Community description is required'],
      trim: true,
      minlength: [10, 'Community description must be at least 10 characters long'],
      maxlength: [500, 'Community description cannot exceed 500 characters'],
    },
    gradient: {
      type: Number,
      default: 0,
      min: [0, 'Gradient index must be between 0 and 4'],
      max: [4, 'Gradient index must be between 0 and 4'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    membersCount: {
      type: Number,
      default: 0,
      min: [0, 'Members count cannot be negative'],
    },
    onlineCount: {
      type: Number,
      default: 0,
      min: [0, 'Online count cannot be negative'],
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

const Community = mongoose.model('Community', communitySchema);

export default Community;
