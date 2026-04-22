# Deployment

NEXUS is configured for Render using `render.yaml` and `deployment/Dockerfile`.

## Render

1. Create a new Render web service from this repo.
2. Use the existing `render.yaml`.
3. Set these environment variables in Render.
   Do not rely on a `.env` file in production:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
4. Trigger a fresh deploy after saving the variables.
5. If you change either value later, redeploy again so Vite rebuilds with the new values.

## Local Verification

```bash
cd frontend
npm run build
```

The Docker image runs in production mode, builds the frontend with Vite, and serves it on port `10000` via `npm start`.
