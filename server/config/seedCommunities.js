/**
 * DEVVERSE — Canonical Communities Seed
 *
 * Defines and auto-upserts the 6 agreed Phase 1 technical guilds into MongoDB:
 *   c1: Rustaceans Guild
 *   c2: Frontend Atelier
 *   c3: Distributed Systems Lab
 *   c4: ML Practitioners
 *   c5: Indie Hackers Dev
 *   c6: WebGL & Shaders
 */

import Community from '../models/Community.js';

export const CANONICAL_COMMUNITIES = [
  {
    slug: 'c1',
    name: 'Rustaceans Guild',
    description: 'Everything Rust — from borrow-checker fights to production war stories.',
    gradient: 0,
    onlineCount: 412,
    tags: ['Rust', 'Systems', 'Wasm', 'Cargo'],
  },
  {
    slug: 'c2',
    name: 'Frontend Atelier',
    description: 'A home for people who care about the pixel and the framework equally.',
    gradient: 2,
    onlineCount: 890,
    tags: ['React', 'CSS', 'TypeScript', 'UI/UX'],
  },
  {
    slug: 'c3',
    name: 'Distributed Systems Lab',
    description: 'CAP theorem debates, consensus algorithms, and postmortems.',
    gradient: 1,
    onlineCount: 205,
    tags: ['Go', 'Kubernetes', 'Raft', 'Architecture'],
  },
  {
    slug: 'c4',
    name: 'ML Practitioners',
    description: 'From fine-tuning to inference — practical machine learning talk.',
    gradient: 3,
    onlineCount: 560,
    tags: ['Python', 'PyTorch', 'LLMs', 'Inference'],
  },
  {
    slug: 'c5',
    name: 'Indie Hackers Dev',
    description: 'Shipping solo projects and side quests into real products.',
    gradient: 4,
    onlineCount: 1240,
    tags: ['Fullstack', 'Next.js', 'SaaS', 'Stripe'],
  },
  {
    slug: 'c6',
    name: 'WebGL & Shaders',
    description: 'For people who think the GPU is the most fun part of the browser.',
    gradient: 0,
    onlineCount: 140,
    tags: ['WebGL', 'Three.js', 'GLSL', 'Canvas'],
  },
];

/**
 * Ensures the canonical communities exist in MongoDB.
 * Uses findOneAndUpdate with upsert to prevent duplicates.
 */
export async function seedCommunities() {
  for (const c of CANONICAL_COMMUNITIES) {
    await Community.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
  }
}

export default seedCommunities;
