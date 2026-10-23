/**
 * DEVVERSE — Community Membership Model
 *
 * Grounded in:
 *   - SYSTEM-DESIGN.md (Section 6: Community)
 *   - ANTIGRAVITY-IMPLEMENTATION-BRIEF.md
 *
 * Requirements:
 *   - Reference to User
 *   - Reference to Community
 *   - Compound unique index on (user, community) to prevent duplicate memberships
 *   - Timestamps for joining audit
 */

import mongoose from 'mongoose';

const communityMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Membership must reference a valid user'],
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Membership must reference a valid community'],
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

// Enforce unique (user, community) pair at the database engine level
communityMembershipSchema.index({ user: 1, community: 1 }, { unique: true });

const CommunityMembership = mongoose.model('CommunityMembership', communityMembershipSchema);

export default CommunityMembership;
