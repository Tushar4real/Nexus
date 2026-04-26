<!-- # Project Overview

NEXUS is a Supabase-backed productivity application with four functional routes inside a shared shell: `/` for execution, `/tasks` for backlog planning, `/analytics` for output history, and `/profile` for account basics. It is built with React 18, Vite, React Router, and Supabase Auth/Postgres, with Supabase Realtime as the only data sync layer.

# Current Tech Stack

- **Frontend**: React 18.2.0, React Router DOM 7.14.2
- **Build Tool**: Vite 8.0.9
- **Backend Platform**: Supabase
  - : Supabase Auth (email/password)
  - Database: Supabase Postgres with RLS
  - Real-time: Postgres changes subscriptions
- **UI Libraries**:
  - date-fns 3.0.6 (installed but not currently used in app logic)
  - Recharts 2.10.3 (installed but unused)
- **Deployment**: Docker + Render Web Service
- **Workspace scripts**:
  - Root `package.json` forwards `npm run dev/build/lint` into `frontend/`
  - Frontend has its own `package.json`
- **Dev Dependencies**:
  - @vitejs/plugin-react 6.0.1
  - eslint 9.x + flat config
  - @types/react 18.2.43
  - @types/react-dom 18.2.17

# Core Architecture

```text
frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.jsx          # Shared nav/shell
│   │   └── Auth.jsx              # Login/signup form
│   ├── config/
│   │   └── supabase.js           # Supabase client initialization
│   ├── context/
│   │   └── ThemeContext.jsx      # Dark/light theme state
│   ├── hooks/
│   │   ├── useAuth.js            # Auth bootstrap + signup/login/logout
│   │   └── useTasks.js           # Realtime task load + CRUD helpers
│   ├── pages/
│   │   ├── Analytics.jsx         # Heatmap + summary stats
│   │   ├── Dashboard.jsx         # Execution zone
│   │   ├── Profile.jsx           # Minimal account page
│   │   ├── RoutePlaceholders.jsx # Only used for any remaining placeholder routes
│   │   └── Tasks.jsx             # Planning backlog grouped by urgency
│   ├── utils/
│   │   ├── constants.js          # Legacy constants, mostly unused
│   │   └── helpers.js            # Date helpers
│   ├── App.jsx                   # Root routes + auth gate
│   ├── main.jsx                  # React entry point
│   └── styles.css                # Global CSS and page styles
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js

database/
└── supabase_schema.sql           # Postgres schema + RLS policies

deployment/
└── Dockerfile                    # Render image

docs/
├── START_HERE.md
├── SETUP.md
└── DEPLOYMENT.md

render.yaml
package.json                      # Root script proxy into frontend/
```

**Data Flow**: User action -> page/component -> hook -> Supabase API -> realtime listener -> hook state -> rerender

**State Management**: React local state only. Supabase Postgres is the source of truth. No Redux, Zustand, or custom cache layer beyond a tiny in-memory auth profile cache.

# Established Patterns

## Code Style

- **CSS Variables**: Theming stays in `styles.css` using the `data-theme` attribute.
- **Functional Components**: Hooks-only, no classes.
- **Async/await**: All Supabase calls use async/await and throw on mutation failure.
- **Minimal abstraction**: Direct hook-to-Supabase access, no service layer.
- **Mono usage**: `.mono` is reserved mainly for numbers and key metrics.

## Component / Route Patterns

- **React Router**: Auth-gated nested routes under `<AppShell />`
- **Outlet pattern**: Shared shell renders `<Outlet />`
- **Route set is now live**:
  - `/` -> `Dashboard`
  - `/tasks` -> `Tasks`
  - `/analytics` -> `Analytics`
  - `/profile` -> `Profile`
- **Theme toggle**: Shared `useTheme()` context with `localStorage` persistence

## Data Patterns

- **Task weights**: 10 (Easy), 40 (Medium), 100 (Hard)
- **Execution target**: 100 points per day
- **Dates**: `YYYY-MM-DD` via `localDateKey()`
- **Task grouping on `/tasks`**:
  - `Today`: due today or overdue
  - `Upcoming`: due within next 7 days
  - `Later`: anything beyond that
- **Analytics heatmap**:
  - last 84 days
  - intensity based on completed daily points

## Supabase Patterns

- **Tables**:
  - `profiles`: `id`, `name`, `email`, `avatar`
  - `tasks`: `id`, `user_id`, `text`, `weight`, `completed`, `target_date`, `completed_day`
- **RLS**: all access depends on `auth.uid()`
- **Signup profile behavior**:
  - DB trigger creates profile row
  - client upsert remains as fallback
- **Realtime**:
  - one `postgres_changes` subscription per signed-in user
  - filter syntax must remain `user_id=eq.${userId}`

## Error Handling

- **Config errors**: shown as full-screen setup state
- **Recoverable auth errors**: do not block the whole app if a profile fetch fails
- **Task/page mutation errors**: surfaced inline on the relevant page
- **Known normalized auth copy**:
  - `email rate limit exceeded` is translated into a clearer local-dev message

# Non-Obvious Quirks

- **Env loading**: Vite is configured to load env from the repo root `.env`, not `frontend/.env`
- **Root npm commands**: root `package.json` proxies into `frontend/`
- **StrictMode removed in dev entry**: this was done to reduce duplicate auth bootstrap work during development
- **Auth bootstrap is optimistic**:
  - session user is rendered immediately
  - profile hydration finishes in background
- **Profile cache**: `useAuth()` keeps a small in-memory cache for profile hydration speed
- **Dashboard quick add**:
  - input auto-focuses on mount
  - refocuses after successful submit
- **Profile delete limitation**:
  - current delete action removes `tasks` + `profiles` rows and signs the user out
  - it does **not** remove the row from `auth.users`
  - full auth-user deletion requires a server-side action with `service_role`

# Resolved / Important Bugs (Do Not Reintroduce)

- **Supabase URL**: strip `/rest/v1` suffix from `VITE_SUPABASE_URL`
- **Auth bootstrap**: must call `getSession()` and also subscribe to `onAuthStateChange()`
- **Profile race**: fallback `upsertProfile()` still matters after signup
- **Realtime filter**: must use `user_id=eq.${userId}`
- **Completed day reset**: unchecking a task must set `completed_day: null`
- **Task sort timestamp**: `created_at` from Supabase is a timestamp string, not a Firestore `seconds` object
- **Root startup**: root `package.json` exists so `npm run dev` works from repo root
- **Vite/plugin mismatch**: `@vitejs/plugin-react` was updated to a Vite 8-compatible version

# Current Route Behavior

## `/` Dashboard

- Execution-focused page
- Progress block is dominant
- Shows:
  - current points / 100
  - progress bar
  - completed count
  - open due count
  - current streak
- Due task list:
  - points shown prominently
  - checkbox toggles completion
  - task rows update via realtime sync
- Quick add:
  - text input
  - weight toggle
  - submit button

## `/tasks` Planning Backlog

- Functional grouped backlog page
- Groups tasks into `Today`, `Upcoming`, `Later`
- Per-task actions:
  - toggle complete
  - `Push to Today`
  - `Delete`
- Hard tasks get stronger visual treatment

## `/analytics`

- Strict minimal analytics page
- Stats:
  - total points
  - average per day
  - current streak
  - longest streak
- Heatmap:
  - GitHub-style grid
  - 84-day range
  - points-based intensity

## `/profile`

- Minimal account page
- Shows:
  - initials
  - name
  - email
  - theme toggle
  - logout
  - red delete button
- Delete behavior:
  - removes profile/task data
  - signs user out
  - does not fully delete Supabase auth user yet

# Security Considerations

- **Anon key**: safe to expose in browser per Supabase model
- **RLS**: still the primary security boundary
- **Client-only limitation**: any admin auth operation, including full user deletion, cannot be done safely from browser
- **Session storage**: auth session persists in `localStorage`
- **Input handling**: no direct HTML injection paths introduced; React escaping remains relied on

# Performance Notes

- **Auth path faster now**:
  - immediate session-based render
  - cached profile hydration
  - fewer visible delays on first load/login
- **Dev startup faster**:
  - no `React.StrictMode` double-mount in `main.jsx`
- **Realtime approach**:
  - still refetches all tasks on each task table event
  - functional, but not yet optimal for heavier workloads
- **Bundle**:
  - still includes unused `recharts`
  - still no route-level code splitting

# Current State

- ✅ Auth flow working: signup, login, logout, session persistence
- ✅ Root-level `npm run dev/build/lint` works
- ✅ Realtime task loading and updates working
- ✅ Dashboard is fully functional
- ✅ Tasks backlog page is fully functional
- ✅ Analytics page is fully functional
- ✅ Profile page is functional within client-only constraints
- ✅ Theme toggle works globally
- ✅ Build succeeds
- ✅ Lint succeeds

# Known Limitations / Risks

- 🟡 Full account deletion is not complete yet because deleting `auth.users` needs server-side Supabase admin access
- 🟡 Realtime task sync still reloads the full task list on every DB event
- 🟡 No tests are implemented
- 🟡 Recharts remains installed but unused
- 🟡 Legacy helpers/constants still exist and can confuse future work
- 🟡 No loading skeletons or error boundary yet

# Immediate Next Priorities

1. Remove unused `recharts`
2. Decide whether to add a proper server-side account deletion path
3. Reduce full-list reload behavior in `useTasks()` realtime handling
4. Add tests for date logic and critical auth/task flows
5. Clean legacy helpers/constants that no longer match the live app

# Recovery Notes

- If work needs to resume later, start from:
  - `frontend/src/App.jsx`
  - `frontend/src/hooks/useAuth.js`
  - `frontend/src/hooks/useTasks.js`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/Tasks.jsx`
  - `frontend/src/pages/Analytics.jsx`
  - `frontend/src/pages/Profile.jsx`
- Last known safe verification:
  - `npm run lint` passed
  - `npm run build` passed -->
