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

## Quản trị hệ thống

Tài khoản có quyền quản trị hệ thống truy cập `/admin` để tạo nhóm gia đình, tìm tài khoản, gán nhóm, đổi vai trò và gỡ tài khoản khỏi nhóm. Quản trị hệ thống chưa có nhóm vẫn truy cập được trang này; tài khoản thường chưa có nhóm được chuyển đến trang chờ phân bổ. API kiểm tra quyền và các ràng buộc thành viên, bao gồm việc giữ ít nhất một Quản trị chính trong nhóm.

Giao diện hỗ trợ desktop/mobile và giảm chuyển động theo thiết lập hệ điều hành. Icon Material Symbols được lưu tại `apps/web/public/fonts/material-symbols/` kèm giấy phép Apache 2.0. Các mục tải ảnh, chờ duyệt, tìm kiếm toàn cục và thông báo chưa khả dụng ở subtask E2-S3-T2.

Styling trang Admin dùng utility class của Tailwind trong component, bao gồm responsive, hover/focus và trạng thái disabled. CSS riêng chỉ dành cho khai báo font/ligature của icon (`admin-icons.css`) và keyframes tùy chỉnh (`admin-motion.css`); `admin.css` tập hợp các import này. Khi thêm utility phụ thuộc trạng thái, dùng tên class đầy đủ để Tailwind nhận diện lúc build.

## Cổng chất lượng

```bash
yarn verify       # toàn bộ cổng chất lượng (giống CI)
yarn test:int     # integration test với Testcontainers
```

Quy trình nhánh, commit và triển khai: xem tài liệu dự án (`12-onboarding-guide.md`, `10-setup-and-ops-guide.md`).
