#!/bin/sh

set -eu

if [ -d /app/frontend ]; then
  APP_DIR=/app/frontend
else
  APP_DIR="$(CDPATH= cd -- "$(dirname "$0")/../frontend" && pwd)"
fi

cd "$APP_DIR"

npm run build
exec npm run start -- --port "${PORT:-10000}"
