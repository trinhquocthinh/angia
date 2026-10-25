#!/bin/sh
# Tạo role runtime NOBYPASSRLS cho dev, tương đương bước provisioning SIT (10-setup-and-ops-guide §5.1).
# Chỉ chạy một lần khi volume postgres-data còn trống.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_password="$DEV_POSTGRES_APP_PASSWORD" <<'SQL'
CREATE ROLE angia_dev_app LOGIN PASSWORD :'app_password' NOBYPASSRLS;
GRANT CONNECT ON DATABASE angia_dev TO angia_dev_app;
GRANT USAGE ON SCHEMA public TO angia_dev_app;
ALTER DEFAULT PRIVILEGES FOR ROLE angia_dev IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO angia_dev_app;
ALTER DEFAULT PRIVILEGES FOR ROLE angia_dev IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO angia_dev_app;
SQL
