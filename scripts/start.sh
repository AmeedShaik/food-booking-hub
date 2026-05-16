#!/usr/bin/env bash
# Production startup script (used by Render).
#
# 1. Apply DB schema (drizzle-kit push) — idempotent, safe on every restart
# 2. Seed default menu items if the table is empty (idempotent)
# 3. Boot the API server, which also serves the built React app

set -euo pipefail

echo "[start.sh] Activating pnpm via corepack..."
corepack enable >/dev/null 2>&1 || true

echo "[start.sh] Applying DB schema..."
pnpm --filter @workspace/db run push

echo "[start.sh] Seeding default menu items (no-op if already seeded)..."
pnpm --filter @workspace/db run seed-menu || echo "[start.sh] Seed step failed (continuing anyway)"

echo "[start.sh] Starting API server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
