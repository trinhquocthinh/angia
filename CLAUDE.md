# AN GIA — Hướng dẫn cho AI Coding Agent

Tài liệu đặc tả nằm tại `../../Docs/angia/` (đồng bộ từ `12-onboarding-guide.md §9`).
Trước khi viết code: đọc SPEC liên quan trong `04-sdd.md` và mã subtask trong `11-master-plan.md`.

## Quy tắc bất khả xâm phạm

1. **Tuân thủ đặc tả** — điểm chưa rõ thì dừng lại hỏi, không tự suy diễn hành vi nghiệp vụ.
2. **TDD** — viết test trước. Hàm mới ở `domain/`/`application/` có unit test, mô tả tiếng Việt mở đầu bằng `TC-xxx` khi có mã. Mọi API route dữ liệu sức khỏe có integration test `expectCrossFamilyDenied`.
3. **Phân tầng** — `Presentation → Application → Domain`; Infrastructure hiện thực Ports. `domain/` không import package ngoài. 1 component / 1 use case / 1 tiện ích trên 1 tệp; ≤ 250 dòng/tệp, ≤ 60 dòng/hàm. `index.ts` chỉ re-export. ESLint cưỡng chế (`tooling/eslint/layerBoundaries.test.ts`).
4. **Cô lập đa gia đình** — mọi truy vấn dữ liệu sức khỏe bọc trong `withFamilyScope`; runtime chỉ dùng role `angia_<env>_app` (`NOBYPASSRLS`). Role owner chỉ dùng cho migration.
5. **Bất biến lược đồ** — không đổi `domain/` hay schema DB khi chưa cập nhật `02-business-rules.md` và `05-tech-spec-architecture.md §3`.
6. **Y đức & riêng tư** — không đưa lời khuyên/chẩn đoán/đánh giá "tốt/xấu/bất thường" (BR-033). Không gửi định danh cá nhân sang dịch vụ AI.
7. **Ngôn ngữ** — định danh code và commit header tiếng Anh/không dấu theo Conventional Commits; chú thích, mô tả test, chuỗi UI tiếng Việt có dấu.
8. **Nghiệm thu trước khi báo cáo** — chạy `yarn verify:fast` (và `yarn verify` trước PR).

## Lệnh thường dùng

| Lệnh                | Việc                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `yarn dev:infra`    | Khởi động PostgreSQL + Garage dev và khởi tạo bucket/key          |
| `yarn dev`          | Chạy contracts (watch) + API + worker + web                       |
| `yarn verify:fast`  | Typecheck + unit test liên quan (hook pre-push)                   |
| `yarn verify`       | OpenAPI → typecheck → lint → format → test → jscpd → knip → build |
| `yarn test:int`     | Integration test với Testcontainers PostgreSQL                    |
| `yarn generate:api` | Sinh `packages/contracts/openapi.json` và kiểu client web         |

## Bẫy đã biết

- Thêm biến môi trường mới → cập nhật `.env.example` và schema Zod tại `apps/*/src/shared/config/`.
- Import trong `apps/api`, `apps/worker`, `packages/contracts` (NodeNext) phải có đuôi `.js`.
- Docker Compose luôn kèm `--project-directory .`.
- Máy dùng Colima: Testcontainers cần `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` và `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`.
