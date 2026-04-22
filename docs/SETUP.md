# Setup

## Environment

Create a repo root `.env` file from the checked-in template:

```bash
cp frontend/.env.example .env
```

Required variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase

1. Create a Supabase project.
2. Enable email/password auth.
3. Run the SQL in `database/supabase_schema.sql`.
4. Copy the project URL and anon key into `.env`.

## Local Development

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The app will be available at `http://localhost:3000`.
