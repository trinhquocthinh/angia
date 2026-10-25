#!/usr/bin/env bash
# Khởi tạo Garage dev: gán layout single-node, nhập key app từ .env và cấp quyền bucket.
# Chạy lại an toàn (idempotent). Image Garage không có shell nên điều khiển qua `docker compose exec`.
set -euo pipefail

cd "$(dirname "$0")/../.."
set -a
# shellcheck disable=SC1091
source .env
set +a

compose=(docker compose -f docker-compose.dev.yml --project-directory .)
garage() { "${compose[@]}" exec -T garage /garage "$@"; }

until garage status >/dev/null 2>&1; do sleep 1; done

node_id="$(garage node id -q | cut -d@ -f1)"
if ! garage layout show | grep -q "${node_id:0:16}.*dev"; then
  garage layout assign -z dev -c 1G "$node_id"
  current_version="$(garage layout show | sed -n 's/.*Current cluster layout version: \([0-9]*\).*/\1/p')"
  garage layout apply --version "$((current_version + 1))"
fi

garage bucket info "$S3_BUCKET" >/dev/null 2>&1 || garage bucket create "$S3_BUCKET"
garage key info "$S3_ACCESS_KEY_ID" >/dev/null 2>&1 \
  || garage key import --yes -n angia-dev-key "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY"
garage bucket allow --read --write "$S3_BUCKET" --key "$S3_ACCESS_KEY_ID"

echo "Garage dev sẵn sàng: bucket '$S3_BUCKET' với key '$S3_ACCESS_KEY_ID'."
