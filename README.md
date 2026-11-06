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

## Schema sổ đau nhức — E19-S2-T1

Đã áp dụng local schema Drizzle 4 bảng và migration sinh `0039_pain_journal` cùng snapshot/journal, nối HEAD `0038_as_needed_and_temperature`. Có FK ghép CASCADE, người ghi SET NULL, CHECK, unique theo vùng/bên khi `tracking` và RLS có cột hồ sơ. Snapshot không đổi định nghĩa các bảng cũ; sinh lại không còn schema diff. Không thêm dependency hoặc API.

Kiểm chứng 2026-11-06 trên bản sao sạch khớp 7/7 tệp source đã áp dụng: test tập trung **32/32 PASS**, gồm ràng buộc DB và RLS bằng role app; `yarn verify:fast` PASS (typecheck toàn workspace, không có unit test liên quan theo `--changed`). ESLint/Prettier tệp thay đổi và `git diff --check` PASS. Tại volume gốc, `verify:fast` qua typecheck nhưng lỗi metadata macOS `._*`.

Lịch sử kiểm tra: lượt không giới hạn worker gặp PostgreSQL `53100: No space left on device`; lượt tuần tự tiếp theo bị gián đoạn khi ColimaData không còn mount và Vitest thiếu tệp preload. Không thay cấu hình hoặc dọn Docker để che lỗi.

**Kiểm chứng lại sau khi mount ColimaData (2026-11-06):** `yarn test:int --maxWorkers=1 --reporter=verbose` PASS, **674/674 integration test / 120/120 suite**, trên PostgreSQL Testcontainers trong bản sao sạch khớp 7/7 tệp source đã áp dụng. `yarn verify:fast` chạy lại sau khôi phục cũng PASS trên bản sao sạch (typecheck toàn workspace, không có unit test liên quan theo `--changed`). Không sửa code/config/dependency để lấy kết quả PASS. Lượt mới thay trạng thái integration bị gián đoạn trước đó; bằng chứng: `/private/tmp/angia-e19-s2-t1-51ybduqu/integration-restored.log` và `verify-fast-restored.log` cùng thư mục. E19-S2-T1 hoàn tất phần source và kiểm chứng local; bước tiếp theo là E19-S2-T2. Chưa push/PR/deploy, migrate DB dev/SIT/Production hoặc đóng E19.

Policy RESTRICTIVE cho bảng cũ thuộc E19-S2-T2. Đồng nhất hồ sơ con với vấn đề cha và các bất biến cần transaction thuộc application E20. Chưa chạy `yarn verify` đầy đủ, migrate DB dev/SIT/Production, push/PR/deploy hoặc đóng E19.

## E19-S2-T2 — Quyền ghi tự xem local (2026-11-06)

Owner đã duyệt và yêu cầu áp dụng E19-S2-T2. Đã bổ sung 87 policy RESTRICTIVE (INSERT/UPDATE/DELETE) cho 29 bảng RLS cũ trong migration `0039_pain_journal`; 4 bảng sổ đau nhức giữ quyền ghi đúng hồ sơ. Khai báo Drizzle/snapshot đồng bộ, journal giữ nguyên; sinh lại không còn schema diff. Kiểm kê trên HEAD nền `74bc8aa`: **0 luồng ghi đang được gọi qua `withSelfScope`**, không có ngoại lệ. Hồ sơ chi tiết: [nghiệm thu E19](../../Docs/angia/acceptance/v0.3/epic19-acceptance.md).

Bốn repository thuốc/lịch hẹn/liều/nhiệt độ có tham số `profileReadLock` mặc định `share`; riêng `createSelfProfileRepository` truyền `null` để dùng SELECT thường. PostgreSQL áp dụng policy UPDATE cho SELECT FOR SHARE, nên giữ khóa này sẽ làm GET tự xem trả 404. Owner đã duyệt đánh đổi: GET tự xem không giữ khóa SHARE để tuần tự hóa với thay đổi đồng thuận đồng thời; cổng đồng thuận vẫn kiểm, luồng main vẫn khóa như cũ.

TC-707/708/710 và hồi quy TC-565–572 PASS local. Bộ tập trung: 132/132 test, 5/5 suite. Toàn bộ `yarn test:int --maxWorkers=1 --reporter=verbose`: **762/762 integration test / 121/121 suite PASS**, trên PostgreSQL Testcontainers trong bản sao sạch khớp SHA-256 42/42 tệp source đã áp dụng. `yarn verify:fast` PASS trên bản sao sạch (typecheck toàn workspace, --changed không chọn unit test liên quan). Trên thư mục gốc, lệnh nguyên bản typecheck PASS nhưng Vitest lỗi parse metadata AppleDouble `._createS3ObjectReader.test.ts`; thử thêm `--exclude '**/._*'` cũng chưa tránh được lỗi dựng đồ thị import. Không sửa config/dependency hoặc xóa metadata để lấy kết quả PASS. ESLint/Prettier tệp đổi và `git diff --check` PASS. Bằng chứng tạm: `/private/tmp/angia-e19-s2-t2-md84r_gd/` (`red-final.log`, `policy-green-lock-red.log`, `focused-green.log`, `integration.log`, `verify-fast.log`, `verify-fast-applied.log`, `verify-fast-applied-filtered.log`, `generate-check.log`, `applied-source-sha256.json`).

T2 hoàn tất phần source và kiểm chứng local. Chưa chạy `yarn verify` đầy đủ, push/PR/deploy, migrate DB dev/SIT/Production hoặc đóng E19. Nhóm kiểm kê route `self_write`, helper `expectSelfWriteDenied` và phá thử TC-704–706/709 vẫn thuộc E19-S3-T1; đây là bước tiếp theo. Tài liệu dự án ngoài Git được cập nhật riêng với mã commit sau khi hook hoàn tất.

## E19-S3-T1 — Kiểm kê và phá thử quyền ghi tự quản local (2026-11-06)

Đã bổ sung nhóm `self_write`, kiểm kê TC-709, helper `expectSelfWriteDenied` và snapshot đủ bốn bảng sổ đau nhức. Helper kiểm 404, phản hồi đồng nhất và dữ liệu giữ nguyên cho cả hai đích khác hồ sơ cùng gia đình/khác gia đình.

Phá thử trên PostgreSQL Testcontainers riêng: gỡ restrictive `prescriptions` làm ba ca TC-704 đỏ; gỡ điều kiện hồ sơ trên `pain_entries` làm TC-705 và hai ca TC-706 đỏ. Khôi phục migration: 13/13 test mới xanh. Không đổi migration/schema runtime.

Kiểm chứng bản sao sạch khớp SHA-256 6/6 tệp source: `yarn verify:fast` PASS (22/22 unit liên quan / 2 suite), integration toàn bộ **775/775 test / 122/122 suite PASS**; ESLint/Prettier tệp đổi và `git diff --check` PASS. Trên volume gốc, typecheck PASS nhưng Vitest vướng metadata macOS `._createS3ObjectReader.test.ts`.

Theo phạm vi owner duyệt, TC-705/706 hiện dùng probe DB; kiểm PATCH/repository/use case 404 thật và đủ 30 route đích thuộc E20. Source và checkpoint README được commit cùng nhau; mã commit và kết quả hook được cập nhật riêng trong hồ sơ E19 ngoài Git. Chưa push/PR/deploy hoặc chạy `yarn verify` đầy đủ. Bước tiếp theo: E19-S3-T2. Log RED/GREEN và giới hạn tại [hồ sơ E19](../../Docs/angia/acceptance/v0.3/epic19-acceptance.md).

## E19-S3-T2 — Kiểm chứng trước PR (2026-11-06)

Kiểm chứng source HEAD `d34a043` trên bản sao sạch ngoài dự án (Node 24.15.0/Yarn 4.18.1): `yarn verify:fast` PASS (typecheck đạt; `--changed` không chọn unit test); `yarn verify` PASS, **2.445/2.445 unit test / 492 suite**, gồm OpenAPI, typecheck, lint, format, jscpd, Knip, build và `perf:budget`. SHA-256 2.359/2.359 tệp được Git theo dõi giữ nguyên; OpenAPI/kiểu client sinh ra khớp bản đã commit. Lượt đầu bị sandbox chặn socket IPC của `tsx`; lượt chạy lại ngoài sandbox được duyệt và PASS.

Mọi trang đầu đạt ngân sách 200 KB gzip; build còn cảnh báo chunk lớn hơn 500 kB. Không chạy lại integration ở checkpoint này; kết quả gần nhất của T1 trên cùng source là 775/775 test, 122 suite PASS.

Owner yêu cầu cập nhật tài liệu, commit và mở PR vào `sit`. **E19-S3-T2 chưa hoàn tất:** backup SIT + restore-check phải đạt trước merge vì merge vào `sit` tự kích hoạt deploy. Sau deploy cần kiểm RLS/policy bằng role app, đối chiếu SHA/digest/health và hồi quy tài khoản liên kết: “Đã dùng”/hủy, rút đồng thuận, gỡ liên kết, nhận link mới. Chưa nghiệm thu SIT hoặc promote Production. Bằng chứng và giới hạn tại [hồ sơ E19](../../Docs/angia/acceptance/v0.3/epic19-acceptance.md).

## E20-S1-T1 — Domain PainIssue local (2026-11-06)

Đã áp dụng model `PainIssue` và FSM thuần `transitionPainIssue` theo BR-058/060, SPEC-055. Đóng kiểm trạng thái và ngày khỏi; mở lại xóa ngày khỏi, từ chối khi có vấn đề tracking khác cùng hồ sơ/vùng/bên. Không tự đóng/mở, không thêm dependency hoặc thay schema/API. Application cấp ngày VN và kết quả tìm xung đột; repository bảo vệ đồng thời ở E20-S3-T1.

TDD: RED do thiếu module trước triển khai, GREEN **14/14 unit test** (logic TC-684/685/686/688). Typecheck toàn workspace và ESLint/Prettier ba file mới PASS. `yarn verify:fast` **exit 1** tại Vitest vì metadata AppleDouble `apps/worker/src/features/extraction/infrastructure/._createS3ObjectReader.test.ts`; chạy lại với `--exclude '**/._*'` vẫn lỗi. Không sửa config hoặc xóa metadata để lấy PASS.

**Chưa nghiệm thu task:** TC-691 qua các use case đọc chờ E20-S2-T1; các test logic chưa thay thế integration. Chưa chạy full verify, integration hoặc deploy. Hồ sơ và giới hạn: [checkpoint E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md). Tài liệu đặc tả nằm ngoài repository, được cập nhật riêng.

## E20-S1-T2 — Domain lần ghi đau và bài tập local (2026-11-06)

Đã thêm ba hàm thuần trong `apps/api/src/features/painJournal/domain/` theo BR-059–061, SPEC-054/056:

- `preparePainEntry(issue, command, receivedAt)` kiểm mức nguyên 1–10, mặc định thời điểm tạo từ thời điểm server nhận và chặn tương lai. Chỉ tạo khi `tracking`; sửa được cả hai trạng thái, nhưng vấn đề `resolved` không nhận thời điểm sau cuối ngày khỏi theo giờ VN.
- `checkPainEntryDeletion(entryCount)` chặn xóa lần ghi cuối với `ERR_VALIDATION`, `details.reason = "last_entry"`. Application phải cấp số lượng từ cùng transaction đã khóa hàng vấn đề.
- `prepareExerciseNote(value, kind)` nhận đủ dữ liệu sau ghép PATCH, kiểm tên/ngày và nguồn/người chỉ định. Tạo `self` có người chỉ định bị từ chối; sửa với nguồn `self` trả `prescriber = null`. Bài tập không bị giới hạn theo trạng thái vấn đề.

Application cấp thời điểm server nhận, ghép PATCH, chuẩn hóa trường tùy chọn của bài tập thành `null`, gắn ID và audit/người ghi từ phiên. Contracts kiểm định dạng/độ dài; repository bảo vệ đồng thời ở E20-S3-T1. Các kiểu domain chỉ chứa giá trị nghiệp vụ, không phải DTO phản hồi có ID/audit. Không thêm dependency, thay schema hoặc hợp đồng API.

TDD: 40 test mới đã RED trước triển khai; GREEN **54/54 test domain** (40 mới + 14 FSM cũ), gồm đồng hồ giả neo VN cho TC-683, logic TC-681/693 và giới hạn lần ghi cuối. Thêm **19/19 test contracts/phân tầng PASS**; typecheck toàn workspace, ESLint/Prettier sáu tệp mới PASS. `yarn verify:fast` **exit 1** tại Vitest vì metadata AppleDouble `apps/worker/src/features/extraction/infrastructure/._createS3ObjectReader.test.ts`. Chạy đích danh bốn tệp test domain thật PASS; không ghi nhận verify:fast PASS.

**Chưa nghiệm thu task:** logic domain chưa thay thế integration HTTP, audit, phân quyền hoặc đồng thời. Chưa chạy full verify, integration hoặc deploy. Bằng chứng và trạng thái commit tại [checkpoint E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md), được cập nhật riêng ngoài Git của source.

## E20-S2-T1 — Application vấn đề đau local (2026-11-06)

Đã áp dụng 8 use case tại `apps/api/src/features/painJournal/application/`: mở kèm lần ghi đầu, danh sách, chi tiết, sửa, đóng, mở lại, tác động xóa và xóa. `ports.ts` quy định transaction theo gia đình/phạm vi tự quản, khóa vấn đề khi ghi, tạo lần ghi đầu nguyên tử, cập nhật trạng thái kèm sự kiện và ánh xạ xung đột vùng/bên. Repository thực thi các cam kết này ở E20-S3-T1.

Application kiểm đối tượng đúng hồ sơ trước consent, rồi hợp đồng và trạng thái; ghép PATCH trước khi kiểm cặp vùng/bên; dùng audit từ phiên và thời điểm nhận lệnh do đồng hồ cấp một lần. Đóng/mở lại dùng FSM hiện có và ngày Việt Nam; DTO chỉ xuất trường trong hợp đồng, giữ người ghi `null` và sắp xếp theo đặc tả. Không đổi domain, schema, API hoặc dependency.

TDD: **67/67 test ban đầu RED** với use case chưa triển khai; GREEN **79/79 test application**, gồm 12 ca bổ sung kiểm phòng vệ khi port trả nhầm đối tượng. Tổng kiểm đích danh domain/application/contracts/phân tầng **157/157 test, 12 suite PASS**; typecheck API và ESLint/Prettier tệp mới PASS. `yarn verify:fast` qua typecheck toàn workspace nhưng **exit 1** tại Vitest do metadata AppleDouble `apps/worker/src/features/extraction/infrastructure/._createS3ObjectReader.test.ts`; không ghi nhận verify:fast PASS.

**Chưa nghiệm thu task/Epic:** TC-691 đã kiểm ba use case đọc của T1; bối cảnh thuốc còn chờ E20-S2-T2. Unit dùng port giả chưa thay thế kiểm chứng transaction, RLS, khóa, cascade, đồng thời hoặc HTTP thật. Chưa chạy full `yarn verify`, integration hoặc push/PR/deploy. Source và README được commit cùng task; SHA và trạng thái hook ghi tại [checkpoint E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md). Bước tiếp theo: E20-S2-T2.

## E20-S2-T2 — Application lần ghi, bài tập và bối cảnh thuốc local (2026-11-06)

Đã áp dụng 7 use case tại `apps/api/src/features/painJournal/application/`: `createPainEntry`, `updatePainEntry`, `deletePainEntry`, `createExerciseNote`, `updateExerciseNote`, `deleteExerciseNote`, `getPainContext`. Mỗi use case một tệp theo quy tắc dự án; không gom ba tệp như tên đầu ra gợi ý trong master plan. Tái dùng domain và transaction port của T1; không đổi domain, schema DB, DTO API hay dependency.

Ghi khóa hàng vấn đề trước kiểm trạng thái/đếm lần ghi; đối tượng con phải thuộc đúng hồ sơ/vấn đề. Kiểm phạm vi (kể cả ID con) trước consent, hợp đồng và trạng thái; PATCH ghép dữ liệu hiện có trước kiểm domain. Ghi chú đau rỗng thành null; đổi nguồn bài tập sang self xóa người chỉ định. Audit ghi mới/sửa lấy từ phiên và thời điểm server nhận lệnh; giữ createdBy khi sửa. Các DTO được dựng theo danh sách trường hợp đồng, dùng chung ánh xạ lần ghi/bài tập với chi tiết T1.

**Owner chốt trong chat:** context chỉ nhận đủ cặp from/to hoặc bỏ cả hai; chỉ một mốc → ERR_VALIDATION. Khoảng chỉ định từ 1 đến 366 ngày tính cả hai đầu; không tự cắt. Mặc định dùng ngày VN của lần ghi sớm nhất hiện có tới hôm nay VN, cắt còn 366 ngày gần nhất. Reader nhận profileId và khoảng ngày, chỉ trả liều Khi cần cùng hồ sơ trong ngày VN và đợt thuốc giao khoảng; application không thêm nhận định hoặc liên hệ với cơn đau. TC-691 đã được nối thêm vào use case đọc context; các ghi chú chờ T2 ở checkpoint cũ là lịch sử.

Kiểm chứng local: 54 test mới (4 suite); tổng đích danh domain/application/contracts/phân tầng **211/211 test, 16 suite PASS**. ESLint application và Prettier các tệp thay đổi PASS; typecheck toàn workspace PASS trong `yarn verify:fast`. Lần chạy test trước implementation dừng ở 4 suite do thiếu module use case, chưa có assertion RED; không ghi nhận số test RED. `yarn verify:fast` **exit 1** tại Vitest do metadata AppleDouble `apps/worker/src/features/extraction/infrastructure/._createS3ObjectReader.test.ts` chứa NUL; không ghi nhận verify:fast PASS. Không đổi config hoặc xóa metadata để xử lý lỗi ngoài phạm vi.

Unit với port giả chưa chứng minh transaction/RLS/khóa/đồng thời/cascade hoặc HTTP thật. E20-S3-T1 phải hiện thực các thao tác con đã lọc đủ profileId/issueId/ID con, khóa hàng vấn đề trong cùng transaction, đếm lại trước xóa và reader context scoped. Chưa chạy full `yarn verify` hoặc integration; chưa push/PR/deploy hoặc nghiệm thu task/Epic. Source và README được commit cùng task; SHA và trạng thái hook được ghi tại [checkpoint E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md). Bước tiếp theo: E20-S3-T1.

## E20-S3-T1 — Repository sổ đau nhức local (2026-11-06)

Owner đã duyệt và yêu cầu áp dụng. Đã hiện thực `drizzlePainIssueRepository`, `drizzlePainContextReader` và các hàm đọc/ghi tại `apps/api/src/features/painJournal/infrastructure/`. Giữ nguyên domain, application ports, schema DB, hợp đồng API và dependency. Repository mặc định dùng `withFamilyScope`; scope tự quản được gắn `withSelfScope` từ hồ sơ phiên tại infrastructure, cùng một implementation.

Ghi khóa riêng hàng `pain_issues` bằng `FOR UPDATE` trước khi đọc lần ghi muộn nhất, trạng thái hoặc đếm trước xóa. Mọi đối tượng con lọc đủ gia đình/hồ sơ/vấn đề/ID con. Tạo vấn đề kèm lần ghi đầu và chuyển trạng thái kèm sự kiện nguyên tử; ghi giữ người tạo, cập nhật audit từ phiên. Vi phạm `23505` của riêng `pain_issues_tracking_region_unique` rollback savepoint rồi tra `existingIssueId` để trả `ERR_PAIN_ISSUE_EXISTS`; lỗi DB khác được ném và rollback. ActorRef lấy theo ID tham chiếu từ dữ liệu đã scoped, không mất lịch sử khi tài khoản rời gia đình; tài khoản bị xóa trả null.

Reader context lọc cùng hồ sơ, liều trong [đầu ngày from, đầu ngày sau to) giờ Việt Nam và đợt thuốc giao khoảng, không ẩn theo số đo. Chi tiết/danh sách chỉ xuất trường hợp đồng, giữ thứ tự và đếm đúng. Không có route hoặc thay đổi runtime wiring trong checkpoint này.

Kiểm chứng: **12/12 integration test, 4 suite PASS** trên PostgreSQL 16 Testcontainers, runtime role app `NOBYPASSRLS`, chạy tuần tự `--maxWorkers 1`. Gồm TC-663 buộc hai transaction cùng vượt kiểm tra ban đầu; TC-679 chờ khóa thật khi xóa hai lần ghi cuối; TC-682 sai vấn đề; TC-684 đóng vấn đề chờ lệnh thêm commit rồi kiểm lại ngày; CRUD/audit/cascade, rollback ghi con thất bại, unique sửa/mở lại, self scope và bối cảnh ngày Việt Nam. **211/211 unit test, 16 suite PASS** cho domain/application/contracts/phân tầng. ESLint/Prettier tệp mới PASS. Review độc lập phát hiện một lỗi ActorRef sau thay đổi thành viên; regression đã RED (nhận null), sửa xong GREEN; review lại không còn finding. Lượt test trước implementation dừng vì thiếu module repository, không ghi nhận assertion RED cho lượt đó.

`yarn verify:fast` trên volume gốc qua typecheck toàn workspace nhưng **exit 1** tại Vitest do metadata AppleDouble `apps/worker/src/features/extraction/infrastructure/._createS3ObjectReader.test.ts` chứa NUL. Không sửa config hoặc xóa metadata. Bản sao sạch ngoài dự án khớp SHA-256 2.431/2.431 tệp trước kiểm chứng: `yarn verify:fast` **PASS** (typecheck toàn workspace đạt; `--changed` không chọn unit test, bộ 211 unit đã chạy riêng). Lượt integration song song ban đầu không khởi động được PostgreSQL; Colima còn khoảng 166 MB, chạy tuần tự đã PASS, không dọn Docker ngoài phạm vi.

**Chưa nghiệm thu HTTP/Epic:** các TC trên mới chứng minh use case/repository/DB; mã HTTP và ma trận route thuộc E20-S4. Chưa chạy full `yarn verify`, integration toàn bộ, push/PR/deploy. Source và README được commit cùng task; SHA và kết quả hook ghi trong checkpoint E20 ngoài Git của source. Bước tiếp theo: E20-S4-T1.

## E20-S4-T1 — Route sổ đau nhức hai cửa local (2026-11-06)

Đã nối đủ 30 route (15 thao tác × main/tự quản), dùng lại use case/repository hiện có. Hồ sơ và audit tự quản lấy từ phiên; mọi mutation cần CSRF, mọi phản hồi có `no-store`. Application giữ thứ tự phạm vi → consent → input → trạng thái; body root POST cố chọn `profileId` khác hồ sơ phiên bị chặn `404` theo quyết định owner. Không đổi domain/schema DB/dependency.

Đã bổ sung kiểm kê/probe cho 15 `scoped`, 4 `self`, 11 `self_write`, wiring production/test và sinh OpenAPI/client. Kiểm chứng: 34/34 integration, 229/229 unit PASS; hai suite HTTP mới chạy lại 6/6 PASS với đồng hồ cố định. `verify:fast` và `check:api` PASS trên bản sao sạch; lint PASS, dup 1,35%. Volume gốc vẫn lỗi AppleDouble khi Vitest quét test; knip còn hai export cũ, đối chiếu baseline HEAD cho kết quả giống hệt.

Source và README được commit cùng task; SHA và kết quả hook được ghi riêng trong checkpoint E20 ngoài Git của source. Chưa chạy full verify/integration toàn bộ, chưa push/PR/deploy. Bước tiếp theo **E20-S4-T2**. Bằng chứng, quyết định và giới hạn tại [checkpoint E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md).

## E20-S4-T2 — Integration sổ đau nhức local (2026-11-06)

Đã bổ sung 6 suite nghiệp vụ HTTP và mở rộng suite bảo mật: mở/đọc vấn đề, lần ghi, vòng đời, bài tập, bối cảnh thuốc và cascade. Cùng assertion chạy qua main/tự quản; kiểm audit từ phiên, ngày VN, hợp đồng strict, xung đột, consent, quyền và dữ liệu không đổi khi bị từ chối. Kiểm thêm ID con thuộc sai vấn đề trong cùng hồ sơ, hồ sơ khác cùng gia đình và gia đình khác. TC-687 kiểm xóa vấn đề; TC-718 kiểm xóa hồ sơ dọn đủ 4 bảng, giữ hồ sơ khác; TC-719 kiểm xóa chứng từ đã duyệt giữ nguyên sổ đau nhức. Giữ test đồng thời repository TC-663/679 hiện có.

Owner duyệt riêng các sửa cổng knip: bỏ export nội bộ `actor`, `PainIssueConflict`, `WebPushLibrary`; loại đúng 5 helper test khỏi project production. Không đổi hành vi runtime, schema DB, hợp đồng HTTP hoặc dependency.

**Kiểm chứng:** `yarn verify` PASS trên bản sao sạch, gồm typecheck/lint/format, **2.634 unit/506 suite**, dup **1,35%**, knip thường/production, build và ngân sách bundle **200 KB gzip**. `yarn verify:fast` cuối PASS với **138 unit/10 suite**. SHA-256 source/bản sao khớp **2.457/2.457 tệp** trước cập nhật tài liệu. Volume gốc vẫn lỗi AppleDouble tại `._createS3ObjectReader.test.ts` sau typecheck.

**Lịch sử local trước CI:** integration đã có lượt **167/167 test, 15 suite PASS** trước khi thêm hai ca ghép sai ID con và sửa export/knip; suite bảo mật chạy riêng **6/6 PASS**, gồm hai ca ID con mới. Các lượt integration cuối local bị lỗi khởi tạo container (`unhealthy`, `container stopped`, timeout); chẩn đoán PostgreSQL thuần ngoài dự án tái hiện `Failed to connect to Reaper` trước PostgreSQL/migration. Không thay cấu hình Testcontainers trong source. Đây là hạn chế local; kết quả nghiệm thu cuối ở đoạn dưới.

**Nghiệm thu E20/P20: PASS trên SIT ngày 2026-11-06, 7/7 task.** PR #62 đã merge tại `1a8b8ee`; CI của head cuối `242f448` đạt **840/840 integration test, 134/134 suite**, gồm Build & Docker và verify. Smoke trực tiếp ghi nhận **224 request**, đủ **15/15 thao tác mỗi cửa main/self**; bộ riêng 30 route thiếu phiên trả 401/no-store. Digest runtime, role app NOBYPASSRLS, 4 bảng đau nhức bật RLS, 29 bảng cũ/87 policy và cascade/dọn dữ liệu test đều đạt. Đã xóa storage state tạm.

Ca chéo gia đình, rút đồng thuận self và xóa chứng từ dùng bằng chứng CI; không ghi là đã thao tác live SIT. Runtime kiểm trên bản `0e08a88` chứa E20, chỉ thay đổi asset 3D ở các commit kế tiếp. Biên bản, evidence và giới hạn tại [nghiệm thu E20](../../Docs/angia/acceptance/v0.3/epic20-acceptance.md#nghiệm-thu-và-đóng-e20-trên-sit--2026-11-06). Bước tiếp theo **E21-S1-T1**; UI/v0.3 và Production chưa nghiệm thu.

## E21-S1-T1 — BodyMap2D local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng. `BodyMap2D` tại `apps/web/src/features/painJournal/presentation/BodyMap2D/` nhận `selected` và `onSelect`, mở mặc định mặt trước, giữ lựa chọn khi chuyển mặt. SVG tự vẽ, trung tính; hai mặt có 29/30 vùng tương tác, hợp thành đủ 35 vị trí của 21 mã SPEC-051. Nhãn lấy từ contracts; trái/phải theo người trong hình, vùng chọn dùng nền nhấn và viền 2 px theo Design §10.4. Không thêm dependency, đổi API, domain hoặc schema DB.

Component chưa gắn vào route/sheet. Knip khai báo riêng `BodyMap2D.tsx` làm entry production cho checkpoint độc lập; bỏ entry này khi `NewPainIssueSheet` sử dụng component ở E21-S2-T2.

Test được viết trước implementation; lượt đầu dừng vì thiếu module, chưa có assertion RED. GREEN **12/12 unit test mới**. Chrome headless trong harness tạm ngoài repo kiểm click đủ **59 vùng trên hai mặt/35 vị trí duy nhất**, đối chiếu callback với snapshot contracts v1; Enter/Space, hướng trái/phải, giữ lựa chọn kể cả vùng không hiện ở mặt còn lại đều đạt. Không có lỗi JavaScript hoặc tràn ngang ở 360/390/768/1440 px.

`yarn verify:fast` và `yarn verify` **PASS trên bản sao sạch**, khớp SHA-256 **2.488/2.488 tệp** trước cập nhật README; full verify có **2.657 unit test/512 suite**, dup **1,34%**, Knip thường/production, build và budget **200 KB gzip** đạt. Build còn cảnh báo kích thước chunk > 500 kB. Trên volume gốc, `verify:fast` qua typecheck nhưng **exit 1** do metadata AppleDouble `._*`; không sửa config hoặc xóa metadata để lấy PASS. Lượt full verify đầu dừng ở format Knip; chuẩn hóa file và chạy lại toàn bộ đã PASS. Log, harness và ảnh kiểm tra: `/private/tmp/angia-e21-s1-t1-c52txdfj/`.

Đây là kiểm chứng local của T1, chưa nghiệm thu SIT/Production. Vùng chạm ≥ 44 px, chấm đang theo dõi và nghiệm thu a11y/TC-721 thuộc **E21-S1-T2**; RegionList/TC-720 thuộc T3. README đi cùng commit source; SHA và kết quả hook được ghi riêng trong checkpoint E21-S1-T1 tại SDD, Test Cases, Design Criteria và master plan ngoài Git của source. Chưa push/PR/deploy. Bước tiếp theo **E21-S1-T2**.

## E21-S1-T2 — Vùng chạm và trợ năng BodyMap2D local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng. Mỗi vị trí dùng nút HTML thật 44 × 44 px, có nhãn, `aria-pressed` và focus-visible; nút đặt cạnh vùng nhỏ có đường chỉ dẫn về hình. Hình giữ hướng trái/phải theo người trong hình, khung cao 616 px. Prop tùy chọn `trackingLocations` nhận danh sách `(region, side)`; chỉ vị trí khớp cả hai trường hiện chấm `text.secondary` và nhãn “ · đang theo dõi”. Không đổi màu theo mức đau hoặc tự chọn vùng. Callback vẫn chỉ trả vị trí; mở vấn đề đang theo dõi thuộc E21-S2-T2. Không thêm dependency, đổi API, domain hoặc schema DB.

**TC-721: 8/8 ca Playwright PASS**, Chromium cảm ứng và WebKit mô phỏng điện thoại, viewport 360 px: đo đủ 59 nút ở hai mặt/35 vị trí, kích thước ≥ 44 × 44 px, khoảng cách ≥ 8 px, chạm tâm và mép nút trả đúng vùng/bên, Enter/Space/Tab, focus, giữ lựa chọn qua hai mặt, chấm/nhãn cập nhật theo prop. Khung thu còn 296 px vẫn đạt kích thước, khoảng cách và không tràn ngang. Unit hình 2D **14/14 PASS**; có assertion RED trước implementation. Đã xem ảnh hai mặt ở 360 px; không ghi nhận lỗi JavaScript trong lượt chụp.

Harness nằm riêng tại `apps/web/e2e/`, cấu hình Vite không sinh route; không đưa trang kiểm thử vào build ứng dụng. Chạy độc lập, không cần phiên SIT hoặc API:

```bash
yarn playwright install chromium webkit
yarn test:e2e:body-map
```

`yarn verify:fast` và `yarn verify` **PASS trên bản sao sạch**, gồm **2.659 unit/512 suite**, typecheck cả harness/test, lint/format, dup **1,34%**, Knip thường/production, build và budget **200 KB gzip**. Source/bản sao khớp byte **2.497/2.497 tệp** trước cập nhật README. Volume gốc: `verify:fast` qua typecheck và 2.659 test nhưng **exit 1** do hai tệp AppleDouble `._BodyMap2D.test.tsx`, `._getBodyMapRegions.test.ts` bị đọc như test; không sửa cấu hình hoặc xóa metadata trong task này. Build còn cảnh báo chunk > 500 kB. Bằng chứng local: `/private/tmp/angia-e21-s1-t2/`.

T2 đã áp dụng và kiểm chứng local; component chưa gắn vào sheet/route, chưa nghiệm thu trình đọc màn hình/điện thoại thật hoặc SIT/Production, chưa push/PR/deploy. README đi cùng commit source; SHA và kết quả hook ghi tại checkpoint trong `Docs/angia` ngoài Git của source. Không đóng Epic 21/P21. Bước tiếp theo **E21-S1-T3 — RegionList/TC-720**.

## E21-S1-T3 — RegionList local (2026-11-07)

Owner đã chốt ba nhóm theo Design §10.4 và yêu cầu áp dụng: “Đầu và thân” gồm 7 vùng giữa thân; “Tay” gồm vai đến bàn tay (12 vị trí); “Chân” gồm hông, mông đến bàn chân (16 vị trí). Danh mục và nhãn dùng lại contracts SPEC-051; vùng giữa thân chỉ có một dòng. `RegionList` nhận `selected`/`onSelect`, không chọn sẵn, mỗi dòng là radio HTML có nhãn đầy đủ. Mỗi instance có tên nhóm riêng; Tab vào/ra nhóm, mũi tên chọn và quay vòng xuyên ba nhóm, Enter/Space chọn. Viền focus luôn hiện khi radio có focus, kể cả mũi tên trên WebKit.

TC-720 có assertion RED trước implementation; 4 unit mới và 4/4 ca Playwright Chromium/WebKit PASS. Hồi quy BodyMap2D: 14 unit và 8/8 ca Playwright PASS. Harness dùng dữ liệu giả, không gọi API; chạy bằng `yarn test:e2e:body-map`, riêng danh sách thêm bộ lọc `regionList`. Knip có entry tạm cho component độc lập, bỏ khi sheet sử dụng ở E21-S2-T2.

`yarn verify:fast` và `yarn verify` PASS trên bản sao sạch: 2.663 unit test/513 suite, typecheck, lint/format, dup 1,33%, Knip thường/production, build và ngân sách 200 KB gzip. Build vẫn có cảnh báo chunk > 500 kB. Trên volume gốc, `verify:fast` qua typecheck nhưng exit 1 do metadata AppleDouble `._*`; không sửa cấu hình hoặc xóa metadata để lấy PASS.

Chưa tích hợp vào sheet/route, chưa nghiệm thu trình đọc màn hình thật hoặc SIT/Production, chưa push/PR/deploy; không đóng Epic 21/P21. Không đổi domain, DTO, API hoặc schema DB. README đi cùng commit source; SHA và kết quả hook ghi tại checkpoint trong `Docs/angia` ngoài Git của source. Bằng chứng kiểm chứng trên bản sao sạch nằm tại `/private/tmp/angia-e21-s1-t3/`; volume gốc vẫn vướng metadata AppleDouble `._*` trong Vitest. Bước tiếp theo **E21-S2-T1 — Adapter API, hook và tab Đau nhức**.

## E21-S2-T1 — Adapter, hook và tab Đau nhức local (2026-11-07)

Owner đã duyệt phương án và yêu cầu áp dụng. Đã thêm port `PainJournalApi`, adapter đọc danh sách main/self có `no-store`, kiểm DTO bằng contracts và truyền `AbortSignal`; hook `usePainIssues` khóa cache theo tài khoản/gia đình/hồ sơ/phạm vi/bộ lọc dưới tiền tố `profiles`. Hook kiểm gia đình, quyền và đồng thuận, chặn cả refetch thủ công khi không được phép; ẩn dữ liệu trong lúc làm mới hoặc gặp lỗi và làm mới phiên/hồ sơ khi mất quyền.

Tab "Đau nhức" sau "Dòng thời gian" tại `/profiles/:profileId/pain`, vẫn hiện khi ẩn số đo. Thẻ hiển thị vùng/bên, tên tùy chọn, mức `/10`, thời điểm Việt Nam và số lần ghi; nhóm đang theo dõi trước, giữ thứ tự API trong từng nhóm. Nhóm đã khỏi thu gọn khi còn vấn đề tracking, mở sẵn khi chỉ còn resolved. Có hai thẻ skeleton, trạng thái rỗng/lỗi/thử lại và thông báo đồng thuận. Không thêm nhận định hoặc màu theo mức.

Theo phạm vi trung gian đã được owner duyệt, nút "Thêm vấn đề đau", "Ghi mức" và "Xem vấn đề" chỉ xuất hiện khi được cấp callback; route T1 chưa nối thao tác. Mở mới thuộc S2-T2, ghi nhanh thuộc S3-T1, chi tiết và TC-726 thuộc S4-T1; `/my-profile` thuộc S5-T2. Không ghi TC-726 đã PASS trong checkpoint này. Không đổi domain, DB, DTO, API backend hoặc dependency.

14 unit mới PASS, bao gồm adapter, cache/quyền, refetch thủ công, tab/thẻ/nhóm và lỗi đồng thuận. `yarn verify:fast` PASS trên bản sao sạch (44 test liên quan); `yarn verify` PASS với 2.677 test/516 suite, lint/format, dup 1,33%, Knip thường/production, build và budget 200 KB gzip. Route đau nhức 160,2 KB gzip; `/my-profile` 199,9 KB. Build vẫn có cảnh báo chunk > 500 kB. Source và bản sao khớp byte 2.517/2.517 tệp trước cập nhật README. Trên volume gốc, `verify:fast` qua typecheck rồi exit 1 vì metadata AppleDouble `._usePainIssues.test.tsx`; không sửa cấu hình hoặc xóa metadata.

Smoke route thật với API giả trên bản sao tạm: 22/22 ca Chromium/WebKit PASS, gồm 360/390/768/1440 px không tràn ngang, nhóm đã khỏi thao tác bàn phím, tải/rỗng/lỗi/thử lại, chặn member/chưa đồng thuận và khôi phục khi API báo rút đồng thuận. Đã xem ảnh mobile/desktop; không có lỗi JavaScript trong các ca PASS. Script, ảnh và log nằm ngoài source tại `/private/tmp/angia-e21-s2-t1/`; không coi đây là nghiệm thu API live, SIT, điện thoại hoặc trình đọc màn hình thật.

Đã áp dụng và kiểm chứng local; chưa push/PR/deploy, chưa đóng Epic 21/P21. README đi cùng commit source; SHA và kết quả hook ghi tại checkpoint trong `Docs/angia` ngoài Git của source. Bước tiếp theo **E21-S2-T2 — Mở vấn đề hai bước và xử lý vùng đang theo dõi/409**.
