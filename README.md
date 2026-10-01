# An Gia

> Chăm chút từng thói quen, chở che từng thế hệ.

Nền tảng tự lưu trữ quản lý sức khỏe gia đình: số hóa chứng từ y tế bằng AI, theo dõi đợt thuốc, chỉ số sinh tồn và xuất bản tóm tắt tái khám.

## Cấu trúc monorepo

```text
apps/
  api/         Hono + @hono/zod-openapi (Node 22)
  web/         React 19 + Vite + TanStack Router/Query + Tailwind v4
  worker/      Tác vụ nền (pg-boss từ Epic 2)
packages/
  contracts/   Schema Zod và OpenAPI dùng chung web ↔ api
```

## Khởi động nhanh

Yêu cầu: Node 22 LTS (`.nvmrc`), Corepack, Docker Engine + Compose v2.

```bash
corepack enable && yarn install
cp .env.example .env
yarn dev:infra
yarn dev
```

- Web: <http://localhost:5173>
- Health: `curl -s http://localhost:3000/api/health` → `{"status":"ok","db":"ok","storage":"ok"}`

## Cổng chất lượng

```bash
yarn verify       # toàn bộ cổng chất lượng (giống CI)
yarn test:int     # integration test với Testcontainers
```

Quy trình nhánh, commit và triển khai: xem tài liệu dự án (`12-onboarding-guide.md`, `10-setup-and-ops-guide.md`).
