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

Yêu cầu: Node 22 LTS ≥22.13.0 (`.nvmrc`), Corepack, Docker Engine + Compose v2.

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

Playwright TC-092/093 chạy trên SIT bằng `yarn test:e2e`, cần tài khoản main/gia đình thử và ảnh máy đo riêng. Xem [hướng dẫn E2E](e2e/README.md) để chuẩn bị phiên, fixture và job sau deploy trong repo private. CI public chỉ thu thập test bằng `--list`; kết quả E2E thực tế nằm trong workflow private.

Quy trình nhánh, commit và triển khai: xem tài liệu dự án (`12-onboarding-guide.md`, `10-setup-and-ops-guide.md`).

## Giới hạn tài nguyên API và worker

Hardening SEC-20261105 (owner duyệt 2026-11-05):

- Body ngoài route upload multipart tối đa **1 MiB**, đếm byte thực trước validation. Quá ngưỡng trả **413 `ERR_REQUEST_TOO_LARGE`**; upload vẫn dùng giới hạn multipart hiện có.
- Health check gộp các request đồng thời, cache kết quả tối đa **250 ms**; probe quá **2 giây** bị hủy. Probe PostgreSQL hủy sẽ loại kết nối để dừng query, không đổi cấu hình phiên DB của các request nghiệp vụ.
- S3 API/worker có timeout kết nối **2 giây**, request/socket **30 giây**, timeout gây lỗi thực. PUT/DELETE ảnh upload có deadline **30 giây** bao gồm retry; lỗi vẫn rollback, dọn object và trả slot upload như trước. Worker đọc ảnh OCR dừng stream ngay khi vượt **10 MiB**.
- Gom xét nghiệm dùng mảng nội bộ, giữ nguyên dữ liệu đầu vào/thứ tự. Summary chỉ tải bản mới nhất mỗi tên chuẩn hóa tại DB, ngày ≤ `to`, kể cả trước `from`; không đổi phân trang hoặc quy tắc hiển thị xét nghiệm.
- CI chạy `yarn perf:budget` sau build để chặn bundle trang đầu vượt **200 KiB gzip**.

Không có migration, biến môi trường hay dependency mới. Chi tiết bất biến và phạm vi nằm ở mục SEC-20261105 trong `02-business-rules.md`, `04-sdd.md`, `05-tech-spec-architecture.md §3` và `11-master-plan.md` thuộc tài liệu dự án.

Kiểm chứng local 2026-11-05 trên bản sao sạch có nội dung source khớp working tree: `yarn verify:fast` và `yarn verify` PASS, **2.412 unit test**; `yarn test:int --maxWorkers 2` PASS, **647 integration test / 119 suite** trên PostgreSQL Testcontainers. Bundle trang đầu lớn nhất `/my-profile` khoảng **199 KiB gzip**. Chạy trực tiếp trên volume macOS còn vướng metadata `._*`; không sửa cấu hình hay xóa metadata để né lỗi. Lượt integration không giới hạn worker đã lỗi đầy đĩa Colima, sau đó lượt giới hạn 2 worker PASS. Các kết quả này không thay nghiệm thu SIT/Production hoặc xác nhận đã deploy.

Tài liệu vận hành và kịch bản hồi quy của SEC-20261105 nằm ở `10-setup-and-ops-guide.md` và `08-test-cases-specification.md` thuộc tài liệu dự án ngoài Git. Khi áp dụng các changeset BodyWell v0.3, giữ nguyên phần bổ sung hardening độc lập trong BR/SDD/kiến trúc; việc duyệt hoặc cập nhật tài liệu không xác nhận đã triển khai BodyWell.

## Contracts sổ đau nhức — E19-S1-T1

`packages/contracts/src/painJournal/` cung cấp danh mục 21 mã vùng/35 vị trí, DTO Zod strict, giới hạn dữ liệu và danh sách từ cấm dùng chung theo SPEC-051, SDD §2.4 và BR-063. Snapshot `bodyRegions.v1.json` giữ nhãn và bên đã phát hành; chỉ bổ sung danh mục, không tự sinh lại snapshot để chấp nhận việc đổi/xóa vùng cũ.

Schema kiểm hình dạng payload, cặp vùng/bên, độ dài và khoảng ngày khi có đủ hai đầu. Ghi chú đau được trim trước kiểm giới hạn 500 ký tự, chuỗi rỗng thành `null`. Thời điểm server nhận, giá trị mặc định, kiểm dữ liệu sau khi ghép PATCH và trạng thái thuộc application ở E20. Danh sách từ cấm dành cho kiểm nội dung do hệ thống tạo; không lọc lời tự ghi của người dùng.

Kiểm chứng local 2026-11-05 trên bản sao không mang metadata macOS, khớp source đã áp dụng: `yarn verify:fast` và `yarn verify` PASS, **2.427 unit test / 491 suite**; riêng contracts **179 test / 35 suite**, gồm **15 test mới** cho TC-655–659/667/673/694 và các biên hợp đồng. Lượt kiểm đầy đủ gồm sinh OpenAPI, typecheck, lint, format, test, kiểm trùng lặp, Knip, build và bundle budget. Tại volume gốc, `verify:fast` qua typecheck nhưng Vitest vẫn vướng metadata `._*`; không thay cấu hình hoặc xóa metadata. Không có route/API/UI, migration, biến môi trường hay dependency mới trong T1; chưa nghiệm thu SIT/Production.

Checkpoint chi tiết nằm trong `04-sdd.md`, `08-test-cases-specification.md`, `09-design-criteria.md` và `11-master-plan.md` thuộc tài liệu dự án ngoài Git. Bước tiếp theo theo kế hoạch là E19-S2-T1.
