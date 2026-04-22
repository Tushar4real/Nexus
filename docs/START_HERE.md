# START HERE

NEXUS lives in `frontend/`, uses Supabase for auth and data, and reads environment variables from the repo root `.env`.

## First Run

1. Copy the template:
   `cp frontend/.env.example .env`
2. Fill in:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
3. Install dependencies:
   `cd frontend && npm install --legacy-peer-deps`
4. Start development:
   `npm run dev`

## Important Notes

- The Supabase anon key is intended for client use.
- Data isolation depends on the RLS policies in `database/supabase_schema.sql`.
- Live routes are `/`, `/tasks`, `/analytics`, and `/profile`.
- Root scripts proxy into `frontend/`, so `npm run dev` works from the repo root too.

Read `docs/SETUP.md` for database setup and `docs/DEPLOYMENT.md` for Render deployment.
