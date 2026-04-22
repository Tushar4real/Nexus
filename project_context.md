# Project Overview

This project is a React + Firebase web application named NEXUS, positioned as a social productivity operating system. The current product is primarily a personal productivity app with gamification, where users authenticate, manage tasks, earn score/XP, progress through levels, and view analytics. The social/collaborative vision (community posts, groups, global leaderboard) is present in project structure, docs, and security rules, but those product areas are mostly placeholders in the current UI.

At runtime, the app is a single-page frontend served by Vite/Firebase Hosting. It has no custom server; Firebase services provide backend capabilities (Auth, Firestore, and initialized Storage). Most business logic lives in React pages/hooks and Firestore document updates.

# Tech Stack

- React 18
- Vite 5
- Firebase JS SDK (Auth, Firestore, Storage)
- Recharts (analytics visualizations)
- date-fns (date helpers)
- Inline CSS-in-JS style objects with design tokens from constants
- Firebase Hosting configuration for SPA deployment
- Bash helper scripts for setup/deploy

# Features Implemented

- Email/password authentication flow (signup, login, logout) with auth-state persistence.
- Firestore user profile creation on signup with initial gamification stats.
- Task management:
- Create task
- Edit task
- Delete task
- Filter by status, difficulty, and category
- Mark task complete
- Task scoring mechanics:
- XP based on difficulty + time bonus/penalty
- User aggregate increments (`score`, `completed`, `hardTasks`) after completion
- Dashboard experience:
- Overview cards
- Urgent and recent task slices
- Level progress and badges display
- Analytics experience:
- KPI cards
- 14-day trend chart
- Category distribution chart
- Badge state visualization
- Realtime Firestore updates via `onSnapshot`.
- Responsive app shell with mobile sidebar toggle/overlay.
- Firebase Hosting setup (`dist` output + SPA rewrites).

# Features In Progress

- Community page scaffolding exists but is placeholder-only ("coming soon" content).
- Groups page scaffolding exists but is placeholder-only.
- Leaderboard page scaffolding exists but is placeholder-only.
- Streak appears designed into user model and badge logic but update mechanics are not implemented in current write paths.
- Firebase Storage is configured in app bootstrap but no end-user feature currently uses it.

# Missing Features

- End-to-end community functionality:
- Create/read/update/delete posts in UI
- Feed rendering
- Reactions/comments interactions
- End-to-end groups functionality:
- Group creation and membership logic in UI/data model
- Shared group tasks/coordination flows
- Group-level analytics or competition
- End-to-end global leaderboard:
- Cross-user ranking queries
- Pagination/time windows/rules for tie handling
- Notification/reminder system (present in roadmap docs, absent in implementation).
- Production-grade transactional consistency for task completion and score updates (currently split into separate writes).
- `.env.example` template file referenced by docs and setup UX is missing from repository.

# File Structure

```text
App_Project/
├── src/
│   ├── main.jsx                 # Frontend entry: mounts React app
│   ├── App.jsx                  # App shell, auth/error gates, page switching, responsive layout
│   ├── components/
│   │   ├── Auth.jsx             # Login/signup UI and form handling
│   │   ├── Sidebar.jsx          # Main navigation and user panel
│   │   └── UI.jsx               # Shared UI primitives (buttons, modal, form inputs, tags)
│   ├── config/
│   │   └── firebase.js          # Firebase initialization + config guard + exported services
│   ├── hooks/
│   │   ├── useAuth.js           # Auth lifecycle and user document hydration/bootstrap
│   │   └── useFirestore.js      # Generic realtime collection hook with CRUD helpers
│   ├── pages/
│   │   ├── Dashboard.jsx        # User overview, urgent/recent tasks, level/badge progress
│   │   ├── Tasks.jsx            # Task CRUD, filters, completion flow, score updates
│   │   ├── Analytics.jsx        # Trend and category charts + badge/metric summaries
│   │   ├── Community.jsx        # Placeholder page
│   │   ├── Groups.jsx           # Placeholder page
│   │   └── Leaderboard.jsx      # Placeholder page
│   └── utils/
│       ├── constants.js         # Design tokens, categories, levels, badge definitions
│       └── helpers.js           # Scoring, level math, date utility logic
├── database/
│   └── firestore.rules          # Firestore security rules
├── docs/
│   ├── README.md                # Product/developer overview and setup
│   ├── SETUP.md                 # Setup details
│   ├── DEPLOYMENT.md            # Deployment notes
│   └── IMPROVEMENTS.md          # Future enhancement notes
├── scripts/
│   ├── setup.sh                 # Local bootstrap helper (contains env template path mismatch)
│   └── deploy.sh                # Build/deploy helper
├── index.html                   # HTML shell entry
├── package.json                 # Dependencies + scripts
├── vite.config.js               # Vite config (aliases, build/dev settings)
├── firebase.json                # Firebase Hosting config
├── .env                         # Local environment variables (developer machine)
├── dist/                        # Built frontend artifact output
└── node_modules/                # Installed dependencies
```

Key entry points:
- Frontend runtime starts at `index.html` -> `src/main.jsx` -> `src/App.jsx`.
- Data/auth integration starts from `src/config/firebase.js` and is consumed by hooks/pages.
- Security boundary is defined in `database/firestore.rules`.

# Architecture & Data Flow

The application follows a frontend-heavy, BaaS architecture:

1. Initialization and auth gate
- `src/main.jsx` renders `App`.
- `App` calls `useAuth`.
- `useAuth` subscribes to Firebase `onAuthStateChanged`.
- If user is logged in, it fetches `users/{uid}` from Firestore and merges auth identity with profile stats into a single `user` object.
- `App` conditionally renders:
- loading state
- configuration/error state
- auth screen
- main app shell

2. Navigation and page composition
- Page routing is local component state (`dashboard`, `tasks`, `community`, `groups`, `analytics`, `leaderboard`) rather than React Router.
- Sidebar controls active page.
- Selected page receives `userId` and `user` props.

3. Data access pattern
- `useFirestore(collectionName, userId, queryConstraints)` builds a Firestore query constrained by `userId`.
- It subscribes via `onSnapshot` and returns live `data` + CRUD helpers (`add`, `update`, `remove`).
- This pattern drives pages like Tasks and Analytics with realtime updates.

4. Task lifecycle and scoring flow
- User creates/edits/deletes tasks from `Tasks.jsx`.
- On completion:
- Task document is updated to `Completed`, with completion date and computed points.
- User document is updated separately with incremented aggregate counters.
- Dashboard/analytics recompute views from live tasks + user profile fields.

5. Gamification and derived state
- Static progression model (levels, badges, category/colors, etc.) resides in `constants.js`.
- Dynamic calculations (XP from tasks, relative dates, level progress helpers) live in `helpers.js`.
- UI reads computed values; no dedicated backend worker enforces consistency.

6. Backend and security model
- No custom API server exists.
- Firestore security rules enforce per-user task ownership and define access for users/posts/groups.
- Hosting serves built SPA from `dist` with rewrite to `index.html`.

# Known Issues / Risks

- `.env.example` is missing, although docs and setup messaging depend on it.
- `scripts/setup.sh` looks for `config/.env.example`, which does not match documented path and current file layout.
- `package.json` lint script points to `frontend/src`, but source is in `src`.
- `useFirestore` effect dependencies omit `queryConstraints`, which can cause stale subscriptions when constraints change.
- Task completion uses two separate writes (task update, then user aggregate update) without transaction/batch; partial failure can desynchronize score and task status.
- Task form modal initializes local state once from `editing`; switching edit targets can yield stale form data unless remounted/reset.
- Streak is modeled and displayed but not actually updated by implemented flows, so streak-driven badges are effectively unreachable without manual data edits.
- Firestore rules permit any authenticated user to update/delete any group (`/groups/{groupId}`), which is over-permissive.
- Firestore rules allow authenticated users to read all user documents, potentially broader exposure than intended.
- Firebase config diagnostics are logged in client console; low severity but unnecessary in production.

# Next Recommended Steps

1. Stabilize developer setup
- Add root `.env.example` with all required `VITE_FIREBASE_*` keys.
- Fix setup instructions and script path mismatch (`scripts/setup.sh` should copy from root template).
- Correct lint script path to `eslint src`.

2. Fix correctness and data consistency
- Convert task completion updates to Firestore `writeBatch` or transaction.
- Update `useFirestore` dependencies to safely react to query-constraint changes.
- Add explicit error handling/UI feedback for failed writes.

3. Complete gamification loop
- Implement streak update logic (daily completion tracking + reset policy).
- Validate badge unlocking rules against actual tracked metrics.
- Add tests around scoring and level progression helper functions.

4. Harden security model
- Restrict group update/delete rules to owners/admins/membership checks.
- Decide user profile visibility policy and tighten `/users` read rule if needed.
- Add rules tests for tasks, users, groups, and future posts logic.

5. Build missing social features incrementally
- Community MVP: post create/list/delete for owner, then comments/reactions.
- Groups MVP: create/join group, group membership model, basic shared feed/tasks.
- Leaderboard MVP: query and display ranked users by score with paging.

6. Improve maintainability
- Introduce route-based navigation (React Router) as pages expand.
- Separate domain/data logic from heavy page components where complexity grows.
- Add component-level and integration tests for auth, tasks, and analytics flows.

7. Prepare production readiness
- Remove nonessential client-side config logging in production builds.
- Add loading/empty/error states uniformly across all pages.
- Formalize CI checks (lint/test/build) before deployment.
