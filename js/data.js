/* =========================================================
   DEVVERSE — MOCK DATA LAYER
   Local JSON standing in for a backend. Demonstrates arrays,
   objects, and the shapes every page renders from.
   ========================================================= */

const DV_TECH_GRADIENTS = [
  'linear-gradient(135deg,#7c6fff,#4fe3c1)',
  'linear-gradient(135deg,#ff6b5b,#7c6fff)',
  'linear-gradient(135deg,#4fe3c1,#ffb86b)',
  'linear-gradient(135deg,#ffb86b,#ff6b5b)',
  'linear-gradient(135deg,#7c6fff,#ff6b5b)',
];

const DV_PROJECTS = [
  { id: 'p1', art: 'project-7.png', title: 'Nebula UI Kit', desc: 'A glassmorphic component library for ambitious dashboards.', tags: ['React', 'TypeScript', 'Framer Motion'], difficulty: 'Intermediate', likes: 842, views: 12400, category: 'Frontend', author: 'ari-devs', gradient: 0 },
  { id: 'p2', art: 'project-3.png', title: 'PulseDB', desc: 'A lightweight time-series database written for edge devices.', tags: ['Rust', 'WASM'], difficulty: 'Advanced', likes: 1290, views: 30100, category: 'Systems', author: 'kmori', gradient: 1 },
  { id: 'p3', art: 'project-9.png', title: 'Origami Auth', desc: 'Drop-in passwordless auth with WebAuthn and magic links.', tags: ['Node.js', 'Postgres'], difficulty: 'Intermediate', likes: 511, views: 8900, category: 'Backend', author: 'sena.codes', gradient: 2 },
  { id: 'p4', art: 'project-1.png', title: 'Voxel Garden', desc: 'A procedurally generated voxel world renderer in the browser.', tags: ['Three.js', 'WebGL'], difficulty: 'Advanced', likes: 2043, views: 51200, category: 'Graphics', author: 'lumen', gradient: 3 },
  { id: 'p5', art: 'project-8.png', title: 'Flowline', desc: 'A no-code workflow automation canvas for small teams.', tags: ['Vue', 'Node.js'], difficulty: 'Beginner', likes: 322, views: 6100, category: 'Frontend', author: 'priya.dev', gradient: 4 },
  { id: 'p6', art: 'project-4.png', title: 'Shard', desc: 'A distributed key-value store built for chaos testing.', tags: ['Go', 'gRPC'], difficulty: 'Advanced', likes: 987, views: 21300, category: 'Systems', author: 'kmori', gradient: 0 },
  { id: 'p7', art: 'project-6.png', title: 'Palette AI', desc: 'Generates accessible color systems from a single brand hex.', tags: ['Python', 'FastAPI'], difficulty: 'Intermediate', likes: 664, views: 14200, category: 'AI/ML', author: 'noa.ml', gradient: 1 },
  { id: 'p8', art: 'project-13.png', title: 'Driftboard', desc: 'A realtime kanban board with offline-first sync.', tags: ['Svelte', 'CRDT'], difficulty: 'Intermediate', likes: 455, views: 9800, category: 'Frontend', author: 'ari-devs', gradient: 2 },
  { id: 'p9', art: 'project-10.png', title: 'Kestrel CLI', desc: 'A blazing-fast scaffolding tool for monorepos.', tags: ['Rust', 'Clap'], difficulty: 'Beginner', likes: 210, views: 4300, category: 'Tools', author: 'dax', gradient: 3 },
  { id: 'p10', art: 'project-2.png', title: 'Mural', desc: 'Collaborative infinite canvas for design critique.', tags: ['Canvas API', 'WebSockets'], difficulty: 'Advanced', likes: 1544, views: 38700, category: 'Frontend', author: 'sena.codes', gradient: 4 },
  { id: 'p11', art: 'project-5.png', title: 'Cortex Notes', desc: 'A local-first note app with AI-assisted linking.', tags: ['Next.js', 'SQLite'], difficulty: 'Intermediate', likes: 733, views: 16800, category: 'AI/ML', author: 'noa.ml', gradient: 0 },
  { id: 'p12', art: 'project-11.png', title: 'Halcyon', desc: 'A minimalist static site generator with island hydration.', tags: ['TypeScript', 'esbuild'], difficulty: 'Beginner', likes: 388, views: 7200, category: 'Tools', author: 'dax', gradient: 1 },
  { id: 'p13', art: 'project-14.png', title: 'TaskFlow', desc: 'A collaborative task manager with boards, due dates, and live status updates for small teams.', tags: ['JavaScript', 'DOM', 'REST API'], difficulty: 'Beginner', likes: 356, views: 7600, category: 'Web Application', author: 'devon.codes', gradient: 2 },
  { id: 'p14', art: 'project-12.png', title: 'Ledgerly', desc: 'A browser-based invoicing and expense tracker for freelancers, with data saved locally.', tags: ['JavaScript', 'LocalStorage', 'Fetch API'], difficulty: 'Beginner', likes: 214, views: 5100, category: 'Web Application', author: 'priya.dev', gradient: 4 },
  { id: 'p15', art: 'project-15.png', title: 'ScoutBoard', desc: 'A job-application tracker web app — log postings, follow-ups, and interview stages in one board.', tags: ['JavaScript', 'Forms', 'JSON'], difficulty: 'Intermediate', likes: 297, views: 6400, category: 'Web Application', author: 'devon.codes', gradient: 3 },
];

const DV_DEVS = [
  { handle: 'kmori', name: 'Kenji Mori', avatarSeed: 'kmori', followers: 4820, projects: 14, points: 9840, bio: 'Systems engineer obsessed with latency. Building databases that refuse to fall over.', skills: ['Rust', 'Go', 'Distributed Systems'] },
  { handle: 'ari-devs', name: 'Ari Solano', avatarSeed: 'arisolano', followers: 3110, projects: 9, points: 7420, bio: 'Frontend architect. If it doesn\'t feel alive, it isn\'t shipping.', skills: ['React', 'TypeScript', 'Motion Design'] },
  { handle: 'sena.codes', name: 'Sena Park', avatarSeed: 'senapark', followers: 5980, projects: 17, points: 11230, bio: 'Full-stack builder shipping realtime tools for teams that hate meetings.', skills: ['Node.js', 'Vue', 'CRDT'] },
  { handle: 'lumen', name: 'Lumen Cross', avatarSeed: 'lumencross', followers: 8340, projects: 6, points: 15600, bio: 'Graphics programmer. I make the browser do things it was never asked to do.', skills: ['WebGL', 'Three.js', 'Shaders'] },
  { handle: 'noa.ml', name: 'Noa Reyes', avatarSeed: 'noareyes', followers: 2760, projects: 11, points: 6510, bio: 'ML engineer turning research papers into tools people actually use.', skills: ['Python', 'PyTorch', 'FastAPI'] },
  { handle: 'priya.dev', name: 'Priya Nair', avatarSeed: 'priyanair', followers: 1980, projects: 8, points: 4310, bio: 'Building calm software for busy teams.', skills: ['Vue', 'Node.js', 'Design Systems'] },
  { handle: 'dax', name: 'Dax Whitfield', avatarSeed: 'daxwhitfield', followers: 1420, projects: 5, points: 3020, bio: 'Tooling nerd. I build the things that build the things.', skills: ['Rust', 'CLI', 'DX'] },
  { handle: 'devon.codes', name: 'Devon Blake', avatarSeed: 'devonblake', followers: 2210, projects: 7, points: 5230, bio: 'Web app builder. I like turning a messy spreadsheet workflow into something people actually enjoy opening.', skills: ['JavaScript', 'DOM', 'REST API'] },
];

const DV_HACKATHONS = [
  { id: 'h1', title: 'Aurora Hacks 2026', desc: 'A 48-hour sprint for tools that make developers faster.', longDesc: 'Aurora Hacks is DevVerse\u2019s flagship open-track event — no theme, no restrictions, just 48 hours to build the developer tool you\u2019ve been meaning to make. Past winners have gone on to launch as real products.', prize: '$25,000', participants: 3200, difficulty: 'All levels', end: Date.now() + 1000 * 60 * 60 * 61, tags: ['Open Track'], organizer: 'DevVerse Labs', mode: 'Online · Global', gradient: 0,
    tracks: ['Developer Tools', 'Web Performance', 'Open Source'],
    timeline: [ ['Registration opens', 'Now'], ['Hacking begins', 'Fri, 9:00 AM UTC'], ['Submissions close', 'Sun, 9:00 AM UTC'], ['Winners announced', 'Sun, 6:00 PM UTC'] ],
    rules: ['Teams of up to 4 people', 'All code must be written during the event window', 'Any language or framework is allowed', 'Use of AI coding assistants is allowed and encouraged'],
    judging: [ ['Technical execution', '35%'], ['Originality', '25%'], ['Design & UX', '20%'], ['Presentation', '20%'] ] },
  { id: 'h2', title: 'Systems Underground', desc: 'Low-level, high-stakes. Build something the kernel would respect.', longDesc: 'A hackathon for people who think in memory addresses. Systems Underground rewards raw performance and correctness over flashy UI — expect judges to actually read your benchmarks.', prize: '$18,000', participants: 940, difficulty: 'Advanced', end: Date.now() + 1000 * 60 * 60 * 190, tags: ['Systems'], organizer: 'Rustaceans Guild', mode: 'Online · Global', gradient: 1,
    tracks: ['Databases & Storage', 'Networking', 'Compilers & Runtimes'],
    timeline: [ ['Registration opens', 'Now'], ['Hacking begins', 'in 5 days'], ['Submissions close', 'in 12 days'], ['Winners announced', 'in 13 days'] ],
    rules: ['Solo or teams of up to 3', 'Benchmarks must be reproducible from a public repo', 'No proprietary or closed-source dependencies', 'Judges may ask to run your code live'],
    judging: [ ['Performance', '40%'], ['Correctness', '30%'], ['Code quality', '20%'], ['Write-up', '10%'] ] },
  { id: 'h3', title: 'AI for Builders', desc: 'Ship an AI-native dev tool in one weekend.', longDesc: 'Not another chatbot wrapper — AI for Builders is judged specifically on tools that make other developers faster or better at their craft. Bring a model, an API, or just a clever prompt pipeline.', prize: '$30,000', participants: 5100, difficulty: 'Intermediate', end: Date.now() + 1000 * 60 * 60 * 340, tags: ['AI/ML'], organizer: 'ML Practitioners', mode: 'Online · Global', gradient: 2,
    tracks: ['Developer Productivity', 'Code Understanding', 'Agents & Automation'],
    timeline: [ ['Registration opens', 'Now'], ['Hacking begins', 'in 9 days'], ['Submissions close', 'in 23 days'], ['Winners announced', 'in 24 days'] ],
    rules: ['Teams of up to 5 people', 'Any model provider or open-weight model is allowed', 'You must disclose which parts were AI-generated vs hand-written', 'Projects must be usable by someone other than the author'],
    judging: [ ['Usefulness to developers', '35%'], ['Technical execution', '30%'], ['Originality', '20%'], ['Presentation', '15%'] ] },
  { id: 'h4', title: 'Pixel & Motion', desc: 'A hackathon for interfaces that feel like magic.', longDesc: 'Pixel & Motion is the friendliest hackathon on DevVerse — built for people who care about how software feels, not just what it does. Beginners are explicitly welcome and mentors are on standby all weekend.', prize: '$12,000', participants: 1670, difficulty: 'Beginner friendly', end: Date.now() + 1000 * 60 * 60 * 24, tags: ['Frontend'], organizer: 'Frontend Atelier', mode: 'Online · Global', gradient: 3,
    tracks: ['Micro-interactions', 'Accessibility', 'Design Systems'],
    timeline: [ ['Registration opens', 'Now'], ['Hacking begins', 'tomorrow'], ['Submissions close', 'in 3 days'], ['Winners announced', 'in 4 days'] ],
    rules: ['Solo or teams of up to 4', 'Design tools + any frontend framework allowed', 'Must include a short Loom or video walkthrough', 'Mentorship sessions are optional but recommended'],
    judging: [ ['Craft & polish', '35%'], ['Accessibility', '25%'], ['Originality', '25%'], ['Presentation', '15%'] ] },
];

const DV_COMMUNITIES = [
  { id: 'c1', name: 'Rustaceans Guild', members: 18200, desc: 'Everything Rust — from borrow-checker fights to production war stories.', gradient: 0, online: 412 },
  { id: 'c2', name: 'Frontend Atelier', members: 24500, desc: 'A home for people who care about the pixel and the framework equally.', gradient: 2, online: 890 },
  { id: 'c3', name: 'Distributed Systems Lab', members: 9100, desc: 'CAP theorem debates, consensus algorithms, and postmortems.', gradient: 1, online: 205 },
  { id: 'c4', name: 'ML Practitioners', members: 15300, desc: 'From fine-tuning to inference — practical machine learning talk.', gradient: 3, online: 560 },
  { id: 'c5', name: 'Indie Hackers Dev', members: 31200, desc: 'Shipping solo projects and side quests into real products.', gradient: 4, online: 1240 },
  { id: 'c6', name: 'WebGL & Shaders', members: 6700, desc: 'For people who think the GPU is the most fun part of the browser.', gradient: 0, online: 140 },
];

const DV_TECHS = [
  { name: 'TypeScript', icon: '◆', count: 4210 },
  { name: 'Rust', icon: '▲', count: 2870 },
  { name: 'React', icon: '⬡', count: 5120 },
  { name: 'Go', icon: '●', count: 1990 },
  { name: 'Python', icon: '◐', count: 3660 },
  { name: 'WebGL', icon: '◈', count: 980 },
];

const DV_ACTIVITY_TEMPLATES = [
  (d, p) => `<b>${d}</b> pushed a new release of <b>${p}</b>`,
  (d, p) => `<b>${d}</b> starred <b>${p}</b>`,
  (d, p) => `<b>${d}</b> opened a pull request on <b>${p}</b>`,
  (d, p) => `<b>${d}</b> joined the <b>Rustaceans Guild</b>`,
  (d, p) => `<b>${d}</b> earned the <b>Shipping Streak</b> badge`,
  (d, p) => `<b>${d}</b> bookmarked <b>${p}</b>`,
];

/* ---------- Forum seed data (per community) ----------
   Each community starts with a couple of realistic threads so
   the board isn't empty on first visit. Everything after this
   is generated by real localStorage-backed user actions. */
const DV_FORUM_SEED = {
  c1: [
    { title: 'Why we moved off REST for internal services', body: 'We swapped most internal service-to-service calls to gRPC over the last quarter. Latency dropped noticeably and the generated types killed a whole category of bugs. Curious if anyone has regretted a similar move.', author: 'kmori', minutesAgo: 95,
      replies: [
        { author: 'dax', text: 'Did this last year. Tooling friction was real at first but worth it long-term.', minutesAgo: 60 },
        { author: 'sena.codes', text: 'What did you do about browser clients that can\u2019t speak gRPC natively?', minutesAgo: 40 },
      ] },
    { title: 'Borrow checker fights: share your worst one', body: 'Spent four hours yesterday fighting a lifetime issue that turned out to be a one-line fix. What\u2019s the borrow-checker battle that humbled you the most?', author: 'dax', minutesAgo: 320, replies: [] },
  ],
  c2: [
    { title: 'Best practices for component libraries in 2026', body: 'Curious what the consensus is now — headless components + your own styling layer, or a fully-styled system you theme on top of? We\u2019re rebuilding ours and want to avoid the mistakes of the last one.', author: 'ari-devs', minutesAgo: 210,
      replies: [
        { author: 'priya.dev', text: 'Headless every time. Styling lock-in is the thing that ages worst.', minutesAgo: 150 },
      ] },
    { title: 'Anyone actually shipping with View Transitions API?', body: 'It looks great in demos but I\u2019m nervous about real-world support and edge cases with dynamic lists. Would love to hear from someone running it in production.', author: 'sena.codes', minutesAgo: 540, replies: [] },
  ],
  c3: [
    { title: 'Consensus algorithms worth learning this year', body: 'Raft gets all the attention in tutorials, but I\u2019ve been reading about EPaxos for the leaderless properties. Anyone using it outside of academic contexts?', author: 'kmori', minutesAgo: 180, replies: [
      { author: 'lumen', text: 'We evaluated it, ended up sticking with Raft for the simpler mental model.', minutesAgo: 90 },
    ] },
  ],
  c4: [
    { title: 'Fine-tuning small models on a single GPU', body: 'Got a 7B parameter model fine-tuning reasonably on a single 24GB card using LoRA. Sharing notes if anyone\u2019s trying to do the same without a cluster.', author: 'noa.ml', minutesAgo: 260, replies: [
      { author: 'kmori', text: 'This is exactly what I needed, thank you for writing it up.', minutesAgo: 200 },
    ] },
  ],
  c5: [
    { title: 'What\u2019s your solo-project shipping cadence?', body: 'I try to ship something small every two weeks even if it\u2019s rough. Keeps momentum up. What works for other people building alone?', author: 'priya.dev', minutesAgo: 75, replies: [] },
  ],
  c6: [
    { title: 'Best resource for learning WebGL from scratch in 2026?', body: 'Most tutorials I find are five years old and reference deprecated APIs. Looking for something current that still explains the fundamentals rather than just wrapping Three.js.', author: 'lumen', minutesAgo: 410, replies: [
      { author: 'ari-devs', text: 'Second this — most guides skip straight to the abstraction and skip the "why".', minutesAgo: 300 },
    ] },
  ],
};

function dvAvatar(seed, size = 80) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent&size=${size}`;
}

function dvTimeAgo(min) {
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ---------- The Codex seed data ----------
   A handful of illustrative "field notes" from the existing cast of
   developers, so the Codex has real substance the moment someone
   unlocks it — not an empty page waiting for the first contributor. */
const DV_CODEX_SEED = [
  { title: 'The bug wasn\u2019t the code — it was the assumption', category: 'Debugging', author: 'kmori', minutesAgo: 90000,
    problem: 'A distributed cache kept serving stale data for one specific customer, but only on Tuesdays. Spent two days assuming it was a TTL bug.',
    tried: 'Rewrote the eviction logic twice. Added more logging. Blamed the cache library. None of it changed anything.',
    fix: 'It wasn\u2019t the cache at all — a cron job that only ran on Tuesdays was writing directly to the same key, bypassing the cache layer entirely.',
    lesson: 'When a bug has a suspiciously specific pattern (one customer, one day), stop debugging the component you suspect and start mapping everything that touches that data.' },
  { title: 'Why we stopped optimizing before measuring', category: 'Performance', author: 'lumen', minutesAgo: 130000,
    problem: 'Spent a full sprint hand-optimizing a rendering loop everyone "knew" was the bottleneck.',
    tried: 'Manual loop unrolling, object pooling, a custom allocator. Shipped it feeling proud.',
    fix: 'Profiled properly afterward out of curiosity. The loop was 4% of frame time. A single unbatched draw call elsewhere was 60%.',
    lesson: 'Intuition about performance is usually wrong. Profile first, every time, even when — especially when — you\u2019re sure you already know the answer.' },
  { title: 'The migration that taught me to always have a rollback plan', category: 'Architecture', author: 'sena.codes', minutesAgo: 200000,
    problem: 'Ran a database migration during a maintenance window with no tested rollback path, because "it\u2019s a small change."',
    tried: 'When it failed halfway through, tried to manually reverse it live, under pressure, at 2am.',
    fix: 'Eventually restored from a backup taken twenty minutes before, losing that window\u2019s writes.',
    lesson: 'The size of a migration has nothing to do with how badly it can go wrong. Every migration gets a tested rollback, no exceptions, no matter how "small."' },
  { title: 'I shipped a quick fix that took production down for six hours', category: 'Incidents', author: 'dax', minutesAgo: 260000,
    problem: 'A customer reported a minor display bug late on a Friday. Pushed a one-line CSS fix directly to production to close the ticket fast.',
    tried: 'When the site went down minutes later, assumed it was unrelated and spent an hour looking elsewhere.',
    fix: 'The "one-line fix" had been auto-formatted by my editor, silently breaking a build config file I hadn\u2019t actually looked at before committing.',
    lesson: 'There is no such thing as a change too small to review. The size of the diff you intended has nothing to do with the size of the diff you shipped.' },
  { title: 'The interview question that changed how I think about scale', category: 'Career', author: 'noa.ml', minutesAgo: 320000,
    problem: 'Was asked to design a system for "a million users" and jumped straight into sharding and caching layers.',
    tried: 'Built an elaborate answer full of infrastructure the interviewer never asked for.',
    fix: 'The interviewer stopped me and asked what a million users actually meant for this specific product\u2019s access pattern. I hadn\u2019t asked.',
    lesson: '"Scale" is not a number, it\u2019s a shape — read patterns, write patterns, and consistency needs matter far more than raw user count. Ask before you architect.' },
  { title: 'Nobody warns you how lonely solo projects get', category: 'Solo Building', author: 'priya.dev', minutesAgo: 400000,
    problem: 'Six months into a solo side project with no one to show progress to, motivation quietly died and I didn\u2019t notice until I\u2019d stopped opening the repo entirely.',
    tried: 'Tried to power through with willpower alone. Made it worse — every session felt like an obligation.',
    fix: 'Started posting rough, unfinished progress publicly every week, even when it was ugly. The accountability alone kept it alive.',
    lesson: 'Solo doesn\u2019t have to mean silent. Build some kind of audience — even a small one — before you need the motivation, not after.' },
];
