#!/bin/sh

set -eu

if [ -d /app/frontend ]; then
  APP_DIR=/app/frontend
else
  APP_DIR="$(CDPATH= cd -- "$(dirname "$0")/../frontend" && pwd)"
fi

cd "$APP_DIR"

cat > public/runtime-env.js <<EOF
window.__NEXUS_ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}"
};
EOF

npm run build
exec npm run preview -- --host 0.0.0.0 --port "${PORT:-10000}"
