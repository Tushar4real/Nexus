#!/bin/sh

set -eu

if [ -d /app/frontend ]; then
  APP_DIR=/app/frontend
else
  APP_DIR="$(CDPATH= cd -- "$(dirname "$0")/../frontend" && pwd)"
fi

cd "$APP_DIR"

npm run build

cat > dist/runtime-env.js <<EOF
window.__NEXUS_ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}"
};
EOF

exec npm run start -- --port "${PORT:-10000}"
