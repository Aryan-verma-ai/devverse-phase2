# DevVerse — Mongoose Model Design Review & Schema Proposal

**Phase:** Phase D — Node/Express Foundation (Prompt 17)  
**Status:** Approved Specification for Prompt 18 Implementation  
**Inputs Reviewed:**
- [SYSTEM-DESIGN.md](file:///c:/Users/acer/OneDrive/Desktop/DevVerse-Phase%201/SYSTEM-DESIGN.md) (Section 6: Data Model & Relationships)
- [FEATURE-PARITY.md](file:///c:/Users/acer/OneDrive/Desktop/DevVerse-Phase%201/docs/FEATURE-PARITY.md) (Destinations: Explore, Project Detail, Submit Project, Profile, Auth)
- Client Forms: [`SubmitProjectPage.jsx`](file:///c:/Users/acer/OneDrive/Desktop/DevVerse-Phase%201/client/src/pages/SubmitProjectPage.jsx), [`seedProjects.js`](file:///c:/Users/acer/OneDrive/Desktop/DevVerse-Phase%201/client/src/data/seedProjects.js)
- Phase 1 HTML References: `login.html`, `signup.html`, `profile.html`

---

## 1. Scope Comparison & Grounding Analysis

| Field | Source in UI / Forms | Grounded in Scope? | Decision & Justification |
|---|---|---|---|
| **Project.title** | `SubmitProjectPage` input | **Yes** | Required string, 3–120 characters, trimmed. |
| **Project.description** | `SubmitProjectPage` textarea (`desc`) | **Yes** | Required string, 20–2000 characters, trimmed. |
| **Project.category** | `SubmitProjectPage` dropdown (9 categories) | **Yes** | Required enum (`Frontend`, `Backend`, `Fullstack`, `Mobile`, `AI/ML`, `DevOps`, `Systems`, `Web3`, `Graphics`). Indexed. |
| **Project.difficulty** | `SubmitProjectPage` toggle pills | **Yes** | Required enum (`Beginner`, `Intermediate`, `Advanced`), defaults to `Intermediate`. Indexed. |
| **Project.technologies** | `SubmitProjectPage` `tags` input / GitHub import language | **Yes** | Array of trimmed strings. |
| **Project.features** | `SubmitProjectPage` `features` input | **Yes** | Array of strings for bullet points on detail view. |
| **Project.githubUrl** | `SubmitProjectPage` input / GitHub import | **Yes** | Optional URL string with http/https validation. |
| **Project.demoUrl** | `SubmitProjectPage` input | **Yes** | Optional live demo URL string with http/https validation. |
| **Project.timeline** | GitHub import commits list | **Yes** | Array of commit subdocuments `{ hash, message, date }`. |
| **Project.art / gradient** | `seedProjects.js` & `ProjectCard.jsx` visual style | **Yes** | String asset reference (`project-1.png` .. `project-9.png`) and integer gradient index `0..4`. |
| **Project.likesCount / viewsCount** | `ProjectCard`, `ExplorePage`, `ProjectDetailPage` | **Yes** | Numeric counters, defaulting to 0. Real likes will link through Like records in Tier 3. |
| **Project.owner** | `ProjectDetailPage` author badge, ownership permissions | **Yes** | ObjectId reference to `User`. Enforces ownership rules. |
| **Project.comments** | Phase 1 `localStorage.comments.<id>` | **Excluded for now** | Will be implemented in Tier 3 as separate threaded documents or discussion schema. Not included in initial Project model to keep the first slice lean. |
| **Project.slug** | Mentioned optionally in `SYSTEM-DESIGN.md` | **Excluded** | UI routes directly by ID (`/projects/:id`). Adding slugs would create unnecessary indexing/uniqueness overhead for college-project scope. |
| **User.username** | `signup.html` input | **Yes** | Required unique, lowercase alphanumeric string (3–30 chars). Primary public handle. |
| **User.email** | `signup.html` / `login.html` input | **Yes** | Required unique, normalized lowercase email. Hidden from public projections (`select: false`). |
| **User.passwordHash** | `signup.html` password field | **Yes** | Bcrypt hash string. Excluded by default (`select: false`) and stripped in `.toJSON()`. |
| **User.displayName** | `signup.html` name field, `profile.html` | **Yes** | Required display name (1–60 chars). |
| **User.bio** | `profile.html` bio input | **Yes** | Optional string (max 500 chars). |
| **User.avatarUrl** | `profile.html` avatar display | **Yes** | Optional image URL string. |
| **User.skills** | `profile.html` skill chips | **Yes** | Array of trimmed strings. |
| **User.links** | `profile.html` social links | **Yes** | Nested object `{ github, linkedin, twitter, website }`. |
| **User.role** | Authorization rules | **Yes** | Enum `['user', 'admin']`, defaults to `'user'`. |
| **User.preferences** | `settings.html` (theme, motion) | **Excluded from DB** | Handled natively in client `localStorage` and media queries. Storing client display prefs in Mongo adds unnecessary write traffic. |

---

## 2. Proposed Mongoose Schemas (Target for Prompt 18)

### A. User Schema
```javascript
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and dashes'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
      select: false, // Protected: excluded from queries by default
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Critical: never returned in normal query projections
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [60, 'Display name must be at most 60 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be at most 500 characters'],
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    skills: [{
      type: String,
      trim: true,
    }],
    links: {
      github: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);
```

### B. Project Schema
```javascript
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Frontend',
        'Backend',
        'Fullstack',
        'Mobile',
        'AI/ML',
        'DevOps',
        'Systems',
        'Web3',
        'Graphics',
      ],
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    technologies: [{
      type: String,
      trim: true,
    }],
    features: [{
      type: String,
      trim: true,
    }],
    githubUrl: {
      type: String,
      trim: true,
      default: '',
      match: [/^$|^https?:\/\/.+/, 'GitHub URL must start with http:// or https://'],
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
      match: [/^$|^https?:\/\/.+/, 'Demo URL must start with http:// or https://'],
    },
    timeline: [
      {
        hash: { type: String, default: '' },
        message: { type: String, default: '' },
        date: { type: String, default: '' },
      },
    ],
    art: {
      type: String,
      default: 'project-1.png',
    },
    gradient: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a user'],
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
  }
);

// Compound index for catalog querying (Category + Difficulty + Newest)
projectSchema.index({ category: 1, difficulty: 1, createdAt: -1 });

// Text index for search functionality
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });
```

---

## 3. Reference & Ownership Strategy

1. **User 1 ─── * Project**:
   - `Project.owner` stores `ObjectId` pointing to `User._id`.
   - When fetching projects for Explore/Detail: `Project.find().populate('owner', 'username displayName avatarUrl')`.
   - This prevents querying `email` or `passwordHash` while giving the UI the author identity it needs.
2. **Server-Enforced Ownership**:
   - Any `PATCH /api/projects/:id` or `DELETE /api/projects/:id` will verify `req.user._id.equals(project.owner)` before proceeding.

---

## 4. Verification Plan for Models (Prompt 18)
- Unique index enforcement on duplicate usernames and emails.
- Automatic password hash removal in JSON responses.
- Population of `owner` reference.
- Field validation bounds (lengths, enums, required attributes).
