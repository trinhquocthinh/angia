#!/usr/bin/env bash
# E1-S1-T2: chạy spike trong container Linux giới hạn 512 MB, mô phỏng `mem_limit` của angia-worker (Tech Spec §7).
# Cách dùng: `yarn heic:spike:docker [thư-mục-ảnh]` (mặc định fixtures/heic; phải nằm trong thư mục được Colima/Docker chia sẻ).
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
data="$(cd "${1:-$root/fixtures/heic}" && pwd)"
versions="$(node -p "const d=require('$root/package.json').devDependencies; ['heic-convert','heic-decode','sharp','zod','tsx'].map(n=>n+'@'+d[n]).join(' ')")"

docker run --rm --memory=512m --memory-swap=512m \
  -v "$root/scripts/heic-spike:/spike/scripts/heic-spike:ro" \
  -v "$data:/data" \
  -w /spike node:22-slim \
  sh -c "npm init -y >/dev/null && npm i --silent $versions && echo '{\"type\":\"module\"}' > package.json && npx tsx scripts/heic-spike/runHeicSpike.ts /data"
