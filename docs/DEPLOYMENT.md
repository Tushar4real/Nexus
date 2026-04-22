# Deployment

NEXUS is configured for Render using `render.yaml` and `deployment/Dockerfile`.

## Render

1. Create a new Render web service from this repo.
2. Use the existing `render.yaml`.
3. Set these environment variables in Render:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
4. Deploy.

## Local Verification

```bash
cd frontend
npm run build
```

The Docker image builds the frontend and serves it with `vite preview` on port `10000`.
