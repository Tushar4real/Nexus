# NEXUS Docs

NEXUS is a Supabase-backed productivity app with a shared shell and four live routes:

- `/` for daily execution
- `/tasks` for planning and backlog management
- `/analytics` for output history and streaks
- `/profile` for account basics and theme/logout actions

## Stack

- React 18 + Vite
- React Router DOM 7
- Supabase Auth + Postgres + Realtime
- Docker + Render deployment

## Source Of Truth

- App code lives in `frontend/`
- Environment variables are loaded from the repo root `.env`
- Database schema and RLS policies live in `database/supabase_schema.sql`
- Root `package.json` forwards `dev`, `build`, and `lint` into `frontend/`

## Local Setup

1. Copy the template:
   ```bash
   cp frontend/.env.example .env
   ```
2. Add your Supabase values to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install dependencies:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```
4. Start the app from the repo root or `frontend/`:
   ```bash
   npm run dev
   ```

## Key Behavior

- Auth is email/password via Supabase Auth
- Task data is isolated with RLS and synced through Supabase Realtime
- Signup relies on a profile trigger in the database, with a client upsert fallback
- `VITE_SUPABASE_URL` must not include `/rest/v1`

## Docs

- `docs/START_HERE.md` for the quickest setup path
- `docs/SETUP.md` for database and environment setup
- `docs/DEPLOYMENT.md` for Render deployment
- `project_context.md` for the current architecture and known quirks

- [ ] Community posts with voting and comments
- [ ] Group collaboration with shared tasks
- [ ] Global leaderboard
- [ ] Real-time notifications
- [ ] Dark/light theme toggle
- [ ] Task reminders
- [ ] AI-powered task suggestions
- [ ] Mobile app (React Native)

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ by Tushar Chandravadiya using React, Supabase , and modern web technologies.
