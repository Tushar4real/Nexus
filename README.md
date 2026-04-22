# NEXUS

NEXUS is a Supabase-backed productivity app with a live dashboard, email/password auth, realtime task sync, and a lightweight React/Vite frontend.

## Tech Stack

- React 18 + Vite
- Supabase Auth + Postgres + Realtime
- Render + Docker for deployment

## Project Layout

```text
frontend/   React application
database/   Supabase schema and RLS policies
deployment/ Dockerfile for Render
docs/       Setup and deployment guides
```

## Quick Start

1. Copy the frontend env template into the repo root:
   `cp frontend/.env.example .env`
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
3. Install frontend dependencies:
   `cd frontend && npm install --legacy-peer-deps`
4. Start the app:
   `npm run dev`

## Docs

- [`docs/START_HERE.md`](/Users/tusharchandravadiya/Documents/App_Project/docs/START_HERE.md)
- [`docs/SETUP.md`](/Users/tusharchandravadiya/Documents/App_Project/docs/SETUP.md)
- [`docs/DEPLOYMENT.md`](/Users/tusharchandravadiya/Documents/App_Project/docs/DEPLOYMENT.md)
