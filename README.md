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

## E21-S2-T2 — Mở vấn đề hai bước, phạm vi callback local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng phương án bàn giao bằng callback. `NewPainIssueSheet` dùng lại BodyMap2D/RegionList: chọn vùng → tên ngắn và lần ghi đầu; vùng đang theo dõi bàn giao ngay đúng ID, không gửi POST. Form không chọn sẵn mức, giới hạn tên 60/ghi chú 500 ký tự, đổi thời điểm theo giờ Việt Nam và chặn ngày không hợp lệ/tương lai. Mobile dưới 1024 px toàn màn hình; desktop có hai cột ở bước nhập. Dùng ModalDialog hiện có, quản lý focus khi đổi bước, chặn đóng khi đang lưu.

Adapter bổ sung POST main/self với CSRF, no-store, AbortSignal và kiểm DTO strict. Lỗi riêng giữ UUID `existingIssueId` hợp lệ của `409 ERR_PAIN_ISSUE_EXISTS`; 409 thiếu ID giữ form với lỗi, không đoán đích. TC-728 chuyển bản nháp lần ghi (giữ mức, ghi chú, thời điểm) qua callback, **chưa tự ghi thêm**. Hook kiểm quyền/đồng thuận, chống gửi lặp, bỏ phản hồi sau khi unmount/đổi phạm vi/mất đồng thuận và làm mới cache đau nhức của cùng tài khoản/gia đình/hồ sơ cho cả main/self. Không đổi backend, hợp đồng, domain, DB hoặc dependency.

**Ranh giới tích hợp đã duyệt:** `onContinueIssue` nhận `{ kind: 'created', issueId }` hoặc `{ kind: 'existing', issueId, draft?, message? }`. Nơi nhận phải mở chi tiết/ghi nhanh, giữ `draft`, hiển thị `message` và chỉ ghi khi người dùng xác nhận ở T3/T4. Workspace chỉ bật nút tạo mặc định khi caller cung cấp callback, có danh sách và đủ quyền. `PainJournalPage` hiện chưa truyền callback nên route sản phẩm chưa hiện nút tạo; không coi đây là hoàn tất luồng đầu cuối. Form lần ghi đầu dùng radio cơ bản; PainLevelPicker dùng chung/sheet ghi nhanh thuộc E21-S3-T1, trang chi tiết thuộc E21-S4-T1, 3D thuộc E22-S3-T1. Đã bỏ hai entry Knip tạm của BodyMap2D/RegionList vì được sheet sử dụng.

**Kiểm chứng:** RED có assertion thất bại trước implementation cho adapter/application/hook. 14 unit mới; `yarn verify:fast` cuối **PASS 16 test liên quan**, full `yarn verify` **PASS trên bản sao sạch**, gồm **2.691 unit/520 suite**, lint/format, dup 1,33%, Knip thường/production, build và budget 200 KB gzip; route đau nhức **167,0 KB gzip**. Build còn cảnh báo chunk > 500 kB. Playwright **24/24 PASS Chromium/WebKit**: 12 ca mới TC-722/728, main/self, lỗi mạng, bản nháp/focus, phản hồi muộn sau mất đồng thuận, workspace và bố cục 360/1440 px; 12 ca hồi quy TC-720/721. API trong harness là giả lập; chưa nghiệm thu điện thoại, trình đọc màn hình thật, 3D hoặc SIT.

Volume gốc: `yarn verify:fast` qua typecheck nhưng **exit 1** khi Vitest đọc metadata AppleDouble `._newPainIssueForm.test.ts`; không xóa metadata hoặc sửa cấu hình để lấy PASS. Bản sao kiểm chứng loại `._*` và worktree phụ `.claude` vốn có; source gốc giữ nguyên các mục đó. Source/bản sao khớp byte **2.547/2.547 tệp**, gồm code và tài liệu. Log và manifest byte nằm ở `/private/tmp/angia-e21-s2-t2/`. Hướng dẫn chạy test tại [e2e/README.md](e2e/README.md#tc-722728--newpainissuesheet-local).

README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook ghi ở checkpoint trong `Docs/angia` ngoài Git source. Chưa push/PR/deploy, chưa đóng Epic 21/P21. Bước tiếp theo **E21-S3-T1** và nối callback ghi nhanh; hoàn thiện nơi nhận chi tiết ở E21-S4-T1.

## E21-S3-T1 — Picker và sheet ghi nhanh local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng. `PainLevelPicker` dùng chung cho lần ghi đầu và `QuickPainEntrySheet`: không chọn sẵn, 10 ô cùng màu theo trạng thái, radio bàn phím với phím mũi tên và 1–9/0 (=10). Owner duyệt điều chỉnh Design §10.6: chỉ xếp 10 cột khi **vùng chứa đủ 512 px** (10 × 44 + 9 × 8), còn lại 2 hàng × 5; giữ vùng chạm ≥ 44 px, khoảng cách 8 px và không tràn ngang ở viewport 360–1440 px.

Workspace đã có nơi nhận bàn giao mặc định: nút “Ghi mức” mở sheet; tạo vấn đề thành công chỉ báo đã lưu lần ghi đầu; chọn vùng đang theo dõi hoặc 409 trùng vùng mở sheet nhận `draft`/`message`, không tự gửi lần ghi. Sheet có ghi chú 500 ký tự, giờ Việt Nam mặc định bây giờ (bỏ `recordedAt` để server lấy giờ), đổi thời điểm không ở tương lai, khóa form/đóng khi lưu, thông báo `role=status` và làm mới cache sổ đau/timeline theo tài khoản, gia đình, hồ sơ. Mất quyền/đồng thuận hoặc đổi danh tính hủy request và bỏ phản hồi muộn; vòng đời workspace xóa trạng thái khi đổi phạm vi.

409 đã khỏi giữ bản nháp và cho bấm “Mở lại và ghi”; API mở lại chỉ gọi sau thao tác này. Mở lại và ghi là hai request: nếu mở lại thành công nhưng ghi thất bại, vấn đề vẫn đang theo dõi, bản nháp còn trong sheet để thử Lưu lại. Trùng vùng khi mở lại cho chuyển sang vấn đề hiện có với bản nháp. Chỉ bổ sung adapter cho endpoint hiện có; không đổi dependency, hợp đồng API, domain hoặc schema DB. Trang chi tiết/biểu đồ thuộc E21-S4, hộp thoại quản lý trạng thái đầy đủ thuộc E21-S5; `/my-profile` vẫn thuộc E21-S5-T2.

Playwright local **38/38 PASS Chromium/WebKit**, gồm 14 ca ghi nhanh mới và 24 ca hồi quy TC-720/721/722/728. API trong harness là giả lập; test bốn chạm bắt đầu từ nút tab giả lập trong harness, chưa phải nghiệm thu route sản phẩm, điện thoại/trình đọc màn hình thật hoặc SIT. Hướng dẫn tại [e2e/README.md](e2e/README.md#tc-723--quickpainentrysheet-local). Bằng chứng kiểm chứng và bản sao sạch tại `/private/tmp/angia-e21-s3-t1/`; volume gốc vẫn có metadata AppleDouble `._*` và worktree `.claude` vốn có, không sửa/xóa chúng để lấy PASS.

`yarn verify:fast` **PASS** trên bản sao sạch (16 test liên quan); unit riêng sổ đau nhức **68/68 PASS**. Full `yarn verify` **PASS**: 2.702 unit test/524 suite, typecheck, lint, format, dup 1,34%, Knip thường/production, build và budget 200 KB gzip cho mọi trang đầu. Build còn cảnh báo chunk lớn hơn 500 kB. Trên volume gốc, `verify:fast` qua typecheck nhưng exit 1 do AppleDouble `._newPainIssueForm.test.ts`; không coi đó là PASS trực tiếp trên volume gốc. Bản sao khớp byte 2.570/2.570 tệp source/tài liệu trước khi bổ sung đoạn kết quả này.

README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook được ghi riêng trong checkpoint E21-S3-T1 tại `Docs/angia` ngoài Git source. Chưa push/PR/deploy hoặc đóng Epic 21/P21. Bước tiếp theo **E21-S4-T1 — trang chi tiết vấn đề đau**.

## E21-S4-T1 — Chi tiết vấn đề đau local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng. Trang `/profiles/:profileId/pain/:issueId` mở từ “Xem vấn đề”,
ghi nhanh tại chỗ bằng picker hiện có, không chọn sẵn mức; danh sách mới nhất trước, giờ Việt Nam,
ghi chú và “Ghi bởi / sửa bởi”, fallback “Tài khoản đã xóa”; lịch sử trạng thái chỉ hiện khi có sự kiện.
Route file `profiles.$profileId_.pain_.$issueId.tsx` dùng hậu tố `pain_` để không lồng dưới trang danh sách.

Sheet sửa mức/thời điểm/ghi chú có thể xóa trắng ghi chú, giữ giây gốc nếu không đổi thời điểm;
sửa/xóa được cả khi đã khỏi, chặn thời điểm sau ngày khỏi. Xóa cần xác nhận; khi còn một lần ghi,
ẩn thao tác xóa và hiện thông báo BR-060. `422 last_entry` tải lại chi tiết, giữ bản nháp và ẩn xóa.
Lỗi mạng giữ form để thử lại; 404 chi tiết quay về danh sách. Cache tách tài khoản/gia đình/phạm vi/hồ sơ/vấn đề;
request đang gửi bị hủy và bỏ phản hồi muộn khi đổi danh tính hoặc mất đồng thuận.
Refetch chi tiết giữ form đang sửa; dữ liệu bị che khi biết lỗi đọc hoặc không còn quyền.
Không đổi backend, DTO, domain, DB hoặc dependency. Biểu đồ, bài tập và menu quản lý vấn đề đầy đủ
lần lượt thuộc S4-T2, S4-T3 và S5-T1; tích hợp `/my-profile` vẫn thuộc S5-T2.

Owner duyệt riêng phương án R-v3-7: nạp lười mục Nhiệt độ trong `SelfSection.tsx` bằng `lazy/Suspense`,
có trạng thái “Đang tải nhiệt độ…”. Việc này khắc phục bundle chung tăng khi thêm route chi tiết;
không đổi chức năng hoặc quyền của mục Nhiệt độ.

**Kiểm chứng local:** `yarn verify:fast` PASS trên bản sao sạch, 42 test liên quan;
full `yarn verify` PASS với 2.714 unit/530 suite, lint/format, dup 1,43%, Knip thường/production,
build và budget 200 KB gzip cho mọi trang đầu. Trang chi tiết 167,1 KB, danh sách đau nhức 170,3 KB,
`/my-profile` 196,4 KB. Build còn cảnh báo chunk >500 KB vốn có.
Playwright 56/56 PASS Chromium/WebKit, gồm 18 ca chi tiết và 38 hồi quy;
smoke trên bản build xác nhận danh sách → chi tiết → quay về và mở Nhiệt độ sau nạp lười
trên cả hai engine, không lỗi JavaScript hay tràn ngang trang chi tiết ở 360 px.
API trong các kiểm thử trình duyệt là giả; chưa nghiệm thu điện thoại/trình đọc màn hình thật hoặc SIT.

Trên volume gốc, `verify:fast` qua typecheck nhưng exit 1 do metadata AppleDouble `._*`;
không sửa/xóa metadata hoặc worktree `.claude` vốn có. Log, ảnh và bản sao sạch tại
`/private/tmp/angia-e21-s4-t1/`. Hướng dẫn tại [e2e/README.md](e2e/README.md#tc-726--chi-tiết-vấn-đề-đau-local).
README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook ghi riêng tại checkpoint trong `Docs/angia`. Chưa push/PR/deploy; không đóng Epic 21/P21. Bước tiếp theo **E21-S4-T2 — PainIssueChart**.

## E21-S4-T2 — Biểu đồ vấn đề đau local (2026-11-07)

Owner đã duyệt và yêu cầu áp dụng. Trang chi tiết có `PainIssueChart` trước danh sách lần ghi,
lọc 4/12/26 tuần (mặc định 12), từ Thứ Hai của tuần cách đây N − 1 tuần đến hôm nay giờ Việt Nam.
Trục mức cố định 1–10; mọi điểm/nét dùng cùng màu, không nhận định mức hoặc xu hướng.
Hai lần ghi liên tiếp cách nhau hơn 7 **ngày lịch Việt Nam** ngắt nét hoàn toàn, vẫn giữ mọi điểm;
đúng 7 ngày lịch vẫn nối, kể cả khi khoảng thời gian thực vượt 168 giờ.
Dưới 4 lần ghi trong khoảng dùng thẻ mới nhất trước. Bảng dữ liệu ẩn có caption, thời điểm, mức và ghi chú;
`sr-only` đặt trên phần tử bọc để bảng không gây tràn ngang mobile.

Bối cảnh thuốc dùng endpoint SPEC-053 hiện có, cache tách tài khoản/gia đình/phạm vi/hồ sơ/vấn đề/khoảng ngày,
kiểm quyền và đồng thuận, truyền AbortSignal. Làn thuốc dùng cùng miền trục thời gian với lần ghi:
liều “Khi cần” là vạch ngắn có tooltip, đợt thuốc là dải mảnh có tên. Có bản chữ cả khi ít điểm.
Lỗi bối cảnh giữ lần ghi và cho thử lại. Ghi/sửa/xóa lần ghi làm mới query biểu đồ và bối cảnh.
ECharts nạp lười khi đủ 4 điểm, dùng chung mô-đun với biểu đồ sinh hiệu; không thêm dependency,
không đổi backend, contract, domain hoặc DB.

Hướng dẫn kiểm tra tại [e2e/README.md](e2e/README.md#tc-724725--biểu-đồ-vấn-đề-đau-local).
Kiểm chứng trên bản sao sạch: `verify:fast` PASS (22 test liên quan), full `verify` PASS
(2.726 unit/535 suite, lint/format, dup 1,46%, Knip thường/production, build và budget).
Trang chi tiết 169,9 KB gzip; `/my-profile` 196,5 KB, mọi trang đầu dưới 200 KB.
Manifest xác nhận canvas đau và biểu đồ sinh hiệu dùng chung chunk `installSVGRenderer` chứa ECharts;
canvas riêng dưới 2 KB gzip. Playwright 68/68 PASS Chromium/WebKit (66 mobile, 2 desktop),
gồm 12 ca T2 ở mobile 360 px và desktop 1440 px;
tooltip đặt phía trên điểm để không che vạch liều thuốc khi chuyển thao tác chạm.
Rà soát độc lập không có finding cần sửa. Build còn cảnh báo chunk lớn vốn có;
ECharts có cảnh báo instance đã dispose khi chuyển phạm vi/rời trang trong kiểm thử WebKit.
Trên volume gốc, `verify:fast` qua typecheck nhưng exit 1 do AppleDouble `._*`;
không sửa/xóa metadata hay worktree `.claude`. Bằng chứng tại `/private/tmp/angia-e21-s4-t2.Umm1vX/`.
API trong harness là giả; chưa thay thế nghiệm thu thiết bị/trình đọc màn hình thật hoặc SIT.
README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook ghi riêng tại checkpoint trong `Docs/angia`.
Chưa push/PR/deploy hoặc đóng E21/P21. Bước tiếp theo **E21-S4-T3 — bài tập**.

## E21-S4-T3 — Bài tập local (2026-11-07)

Đã áp dụng theo phương án owner duyệt: thẻ và sheet thêm/sửa bài tập trên trang chi tiết,
nguồn bằng chữ, ngày, ghi chú và người ghi/sửa. Nguồn mới không chọn sẵn; ngày bắt đầu
mặc định hôm nay theo giờ Việt Nam. Đổi sang “Tự ghi” xóa người chỉ định trong bản nháp
và backend; đổi lại không khôi phục giá trị cũ. Thêm/sửa được trên vấn đề đã khỏi.
Không có xác nhận “Đã tập”, nhắc hay gợi ý bài tập. Giữ bản nháp khi lỗi mạng,
khóa gửi trùng, hủy request và bỏ phản hồi muộn khi mất phạm vi/đồng thuận.
Lưu bài tập giữ nguyên bản nháp ghi nhanh; trả focus về nút mở trên Chromium/WebKit.
Vùng cuộn riêng bảo đảm ô ghi chú không bị footer che ở sheet dài 360 px.

Owner duyệt mở rộng SPEC-056: PATCH `endDate: null` xóa ngày kết thúc; bỏ trường giữ ngày cũ,
chuỗi rỗng hoặc ngày sai bị từ chối. POST vẫn không nhận `null`. Đã đồng bộ schema contracts,
use case API, OpenAPI và kiểu client; không đổi domain, schema DB hoặc dependency.

Kiểm chứng trên bản sao sạch: `verify:fast` PASS 83 test liên quan; full `verify` PASS (2.736 unit/540 suite,
lint/format, dup, Knip thường/production, build và budget 200 KB gzip).
Playwright 84/84 PASS Chromium/WebKit, gồm 16 ca bài tập ở 360 px.
Trang chi tiết 171,8 KB gzip; `/my-profile` 196,5 KB. Rà soát độc lập không có finding cần sửa;
build còn cảnh báo chunk lớn vốn có. API trong harness là giả.

Integration bài tập và ma trận bảo mật đã thử nhưng Testcontainers báo `Failed to connect to Reaper`
trước PostgreSQL/migration; 10 test bị skip, chưa xác nhận HTTP/DB cho thay đổi mới.
Trên volume gốc, `verify:fast` qua typecheck nhưng lỗi đọc metadata AppleDouble `._*`;
không sửa/xóa metadata hoặc worktree `.claude`. Đối chiếu 2.635/2.635 tệp source/tài liệu khớp byte; cấu hình harness trong bản sao
chỉ bổ sung đường dẫn dependency dùng chung, không áp dụng thay đổi này vào source.
Log RED/GREEN, kiểm chứng và ảnh tại `/private/tmp/angia-e21-s4-t3.LuObaX/`.
README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook ghi riêng tại checkpoint trong `Docs/angia`.
Chưa push/PR/deploy, nghiệm thu thiết bị/trình đọc màn hình thật hoặc SIT; không đóng E21/P21.
Bước tiếp theo **E21-S5-T1 — đánh dấu đã khỏi, mở lại, xóa vấn đề**.

## E21-S5-T1 — Vòng đời vấn đề đau local (2026-11-07)

Đã áp dụng phương án owner duyệt: menu trên trang chi tiết mở sheet đánh dấu đã khỏi,
hộp xác nhận mở lại và hộp xóa `alertdialog`. Ngày khỏi mặc định hôm nay theo giờ Việt Nam,
giới hạn từ ngày lần ghi muộn nhất đến hôm nay; lỗi API giữ ngày đã chọn.
Mở lại không tự ghi mức; `409 ERR_PAIN_ISSUE_EXISTS` có lối “Mở vấn đề đó”.
Xóa lấy số lần ghi/bài tập từ `deletion-impact`, khóa xác nhận khi đang tải hoặc tải lỗi,
chỉ gửi `DELETE { confirm: true }` sau xác nhận. Xóa thành công bỏ cache chi tiết/bối cảnh
và quay về danh sách; đóng/mở lại làm mới danh sách, chi tiết, biểu đồ và lịch sử.

Giữ quyền `main`/`self`, CSRF, cache theo tài khoản/gia đình/hồ sơ; chống gửi lặp,
hủy request và bỏ phản hồi muộn khi đổi phạm vi hoặc mất đồng thuận.
Không đổi backend, contracts, domain, schema DB hoặc dependency.
“Sửa vùng hoặc tên” không thuộc task này; tích hợp `/my-profile` thuộc E21-S5-T2.

Kiểm chứng trên bản sao sạch: `verify:fast` PASS (25 test liên quan),
unit sổ đau nhức 110/110 PASS, Playwright Chromium/WebKit 100/100 PASS,
gồm 16 ca vòng đời mới với API giả. Full `verify` PASS (2.746 unit/546 suite,
lint/format, dup, Knip thường/production, build và budget 200 KB gzip).
Build vẫn có cảnh báo chunk lớn. OpenAPI và kiểu client sinh lại không đổi.
Bộ kiểm trình duyệt không thay thế HTTP/DB,
điện thoại/trình đọc màn hình thật hoặc SIT. Trên volume gốc, kiểm thử gặp metadata
AppleDouble `._*`; không xóa/sửa metadata hoặc worktree `.claude`.
Log tại `/private/tmp/angia-e21-s5-t1-*.log`; bản sao tại `/private/tmp/angia-e21-s5-t1.vmyqdjvy/`.
README và hướng dẫn E2E đi cùng commit source; SHA/kết quả hook ghi ở checkpoint trong `Docs/angia` ngoài Git source.
Chưa push/PR/deploy hoặc đóng E21/P21. Bước tiếp theo **E21-S5-T2**.

## E21-S5-T2 — Sổ đau nhức tự quản local (2026-11-07)

Đã áp dụng local theo phương án owner duyệt: mục “Đau nhức” tại
`/my-profile?section=pain`, nạp lười qua `lazy/Suspense`; trang chi tiết độc lập
`/my-profile/pain/:issueId` dùng cùng khung “Hồ sơ của tôi”. Tài khoản liên kết
`main`/`member` dùng `scope=self`, mọi request đau nhức đi qua
`/api/me/profile/pain-issues` và đường dẫn con, không gửi `profileId` trong body.
Tái sử dụng luồng tạo, ghi nhanh, chi tiết, bài tập và quản lý vòng đời đã có.
Mục vẫn hiện khi ẩn số đo; các mục dữ liệu khác giữ quyền hiện hành.

`PainProfileContext` chỉ lấy `id`, `familyId`, `consentStatus` cần cho sổ đau nhức;
hồ sơ tự quản lấy từ tóm tắt API và gia đình trong phiên, không ép kiểu hoặc tạo
metadata hồ sơ giả. Chặn tóm tắt khác liên kết phiên, mất liên kết và đồng thuận.
Review phát hiện việc dựng skeleton khi tải lại tóm tắt làm mất bản nháp;
đã tái hiện RED và sửa: tải lại cùng hồ sơ giữ form, kết quả mất quyền vẫn đóng nội dung.

Kiểm chứng trên bản sao sạch: `yarn verify:fast` và full `yarn verify` PASS,
2.747 unit test/546 suite; lint/format, dup, Knip thường/production, build và
budget 200 KiB gzip đạt. `/my-profile` và chi tiết tự quản đều 197,5 KiB gzip.
Manifest ghi `SelfPainJournal` là dynamic entry; test trình duyệt xác nhận chưa tải
chunk hoặc gọi API đau nhức trước khi mở mục. OpenAPI/kiểu client sinh lại không đổi.
Build còn cảnh báo chunk lớn vốn có.

Playwright 116/116 PASS Chromium/WebKit ở 360 px (16 ca mới trên route sản phẩm
với API giả và 100 ca hồi quy, trong đó có ca desktop của biểu đồ).
Ca mới kiểm main/member ghi → khỏi → mở lại, tạo từ danh sách rỗng,
đường dẫn trực tiếp/tải lại/quay về, CSRF và endpoint tự quản, mất đồng thuận,
đổi liên kết, giữ bản nháp khi kiểm lại hồ sơ và mục xét nghiệm vẫn chỉ đọc.
Rà soát độc lập sau sửa không còn finding cần xử lý.

Volume gốc có metadata AppleDouble `._*`; kiểm chứng dùng bản sao sạch và
đối chiếu byte trước khi áp dụng, không xóa/sửa metadata hoặc worktree `.claude`.
Bản sao và log tại `/private/tmp/angia-e21-s5-t2.PrXk0f/`,
`/private/tmp/angia-e21-s5-t2-*.log`.
Không chạy lại integration HTTP/DB vì task chỉ thay web.

Chưa push/PR/deploy, chưa nghiệm thu API live, điện thoại/trình đọc màn hình thật
hoặc SIT. Bốn thao tác trong test bắt đầu từ `/my-profile` đã mở;
không dùng thời gian API giả làm bằng chứng NFR-8. Còn nghiệm thu luồng
mở → ghi → khỏi → mở lại trên SIT cho main/tài khoản liên kết và đo 5 lần trên
điện thoại thật, trung vị ≤15 giây, ≤4 chạm theo NFR-8.
**Chưa đóng E21/P21 hoặc đánh dấu hoàn tất nghiệm thu E21-S5-T2.**

## Epic 21 — Chuẩn bị PR vào SIT (2026-11-08)

PR từ `feature/v0.3/Epic-21` vào `sit` gom 11 task UI E21-S1-T1 → E21-S5-T2:
chọn vùng 2D/danh sách, tạo vấn đề, ghi nhanh, chi tiết/biểu đồ/bài tập,
đóng/mở lại/xóa và sổ tự quản. Mục Nhiệt độ được nạp lười theo quyết định R-v3-7.
Thay đổi API đi kèm S4-T3 cho phép PATCH bài tập với `endDate: null` để xóa ngày
kết thúc; cần CI integration kiểm lại thay đổi này, không coi toàn PR chỉ đổi web.

Kiểm chứng local gần nhất: `verify:fast`, full `verify` và 116/116 Playwright
PASS trên bản sao sạch khớp byte với source; `/my-profile` 197,5 KiB gzip.
Merge vào `sit` kích hoạt CI và dispatch pipeline build/sign/deploy hiện hành.
Nghiệm thu API live/điện thoại/trình đọc màn hình và NFR-8 trên SIT vẫn còn chờ;
PR và deploy thành công chưa đồng nghĩa đóng E21/P21.

## Sửa cuộn nền và bố cục modal — local (2026-11-08)

Đã áp dụng bản sửa owner duyệt trên nhánh `codex/fix-modal-scroll-layout`:
CSS `html:has(dialog:modal)`/`body:has(dialog:modal)` khóa cuộn trang nền khi
còn modal native đang mở; đóng modal cuối khôi phục cuộn. Modal chọn vùng đau
dùng `div` cuộn bên ngoài `fieldset`, form giới hạn chiều cao và header/footer
không co lại. Hình/nhãn và dòng đã chọn cuộn trong thân modal, không phủ nút
“Tiếp tục”; giữ kích thước nút chọn vùng hiện hành.

Đã tái hiện RED trên bản sao: backdrop làm trang cuộn 700 px trên Chromium/WebKit,
và Chromium vẽ nhãn vùng phủ footer. Sau sửa, 16/16 ca modal mới và toàn bộ
116/116 ca `test:e2e:body-map` PASS; các ca wheel dùng context desktop, kiểm thêm
viewport 360/768/930/1440 px, cuộn tới bàn chân/dòng đã chọn, modal chồng nhau
và giữ vị trí trang. Các ca khác giữ cấu hình cảm ứng hiện hành.

`yarn verify:fast` PASS (typecheck và 7 unit liên quan); full `yarn verify` PASS
(2.747 unit/546 suite, lint/format, dup, Knip thường/production, build và budget).
`/my-profile` 197,4 KiB gzip, chi tiết tự quản 197,5 KiB; mọi trang đầu đạt trần
200 KiB. Review độc lập không có finding cần xử lý. Build còn cảnh báo chunk lớn
vốn có; hồi quy WebKit có cảnh báo ECharts instance đã dispose khi chuyển phạm vi.

Kiểm chứng dùng bản sao sạch tại `/private/tmp/angia-modal-fix.tr2dm4/` và log
`/private/tmp/angia-modal-fix-*.log`; source được đối chiếu byte với bản đã kiểm.
Metadata AppleDouble trên volume gốc giữ nguyên. Hướng dẫn chạy riêng test ở
`e2e/README.md`. Chưa commit/push/deploy hoặc nghiệm thu thao tác vuốt trên
điện thoại thật/SIT trong bản sửa này.

## Hướng dẫn chọn mức đau — local (2026-11-08)

Đã áp dụng nội dung owner duyệt theo bài
[MEDLATEC](https://medlatec.vn/tin-tuc/thang-diem-vas-danh-gia-dau-nhung-dieu-nen-biet):
khối “Hướng dẫn chọn mức đau” luôn hiện trước các ô số, với ba nhóm
1–3 · Đau nhẹ, 4–6 · Đau trung bình, 7–10 · Đau nặng cùng mô tả đã duyệt,
mốc 10 “Đau dữ dội nhất bạn có thể hình dung.” và lời nhắc tự chấm theo cảm nhận.
Component dùng chung cho tạo vấn đề, ghi nhanh, ghi tại chỗ và sửa lần ghi;
`aria-describedby` nối hướng dẫn với radiogroup. Đây là hướng dẫn nhập tĩnh;
radio, payload, thông báo lưu, thẻ, danh sách và biểu đồ giữ điểm số người dùng ghi.

Ngoại lệ đã đồng bộ tại BR-063 §2.8.1, SC18, SPEC-054, Design §10.6 và
TC-723/725 trong `Docs/angia`; bộ từ cấm cho phần trình bày dữ liệu giữ nguyên.
Giao diện chọn số thuộc NRS; không đổi thang dữ liệu 1–10, không thêm khuyến nghị thuốc.
Sheet ghi nhanh/sửa dùng cùng vùng cuộn `div` ngoài `fieldset` như bản sửa modal,
để hướng dẫn dài không làm ghi chú phủ footer ở màn thấp.

Kiểm chứng trên bản sao sạch: `verify:fast` PASS (typecheck, 9 unit liên quan),
full `verify` PASS (2.748 unit/546 suite, lint/format, dup, Knip, build, budget),
Playwright `test:e2e:body-map` 118/118 PASS Chromium/WebKit. TC-723 giữ bốn chạm,
không chọn sẵn; hướng dẫn có mô tả truy cập ở tạo/ghi nhanh/sửa, ghi chú cuộn
được ở 360×650 và 1440×650. TC-725 giữ kiểm không diễn giải dữ liệu đã ghi.
Một lượt đầu gặp lỗi DOM bị gỡ trong ca bài tập WebKit; chạy lại riêng và cả bộ
đều PASS. Review độc lập không có finding cần xử lý.

`/my-profile` 197,4 KiB gzip, chi tiết tự quản 197,5 KiB; mọi trang đầu đạt trần
200 KiB. Bản sao/log tại `/private/tmp/angia-pain-guidance.xoOr5s/` và
`/private/tmp/angia-pain-guidance-*.log`; source đối chiếu byte với bản đã kiểm.
Chưa commit/push/deploy hoặc nghiệm thu điện thoại/trình đọc màn hình thật/SIT
cho thay đổi này. Các sửa modal trước đó được giữ nguyên trên cùng nhánh.

## Nghiệm thu E21/P21 trên SIT — 2026-11-08

**PASS, đóng E21/P21 — 11/11 task theo xác nhận owner:** “tôi đã test và pass trên SIT , tiến hành qui trình nghiệm thu”.
Phạm vi gồm UI sổ đau nhức, tự quản và hai sửa sau review (cuộn/bố cục modal, hướng dẫn chọn mức đau).
[PR #65](https://github.com/trinhquocthinh/angia/pull/65) và [PR #66](https://github.com/trinhquocthinh/angia/pull/66)
đã merge; bản nghiệm thu SIT là `6b31d6d90ecd38457e8b286fa2be6b342c65a71e`.
[CI sau merge](https://github.com/trinhquocthinh/angia/actions/runs/42473486113) và
[pipeline SIT](https://github.com/trinhquocthinh/homelab-deploy/actions/runs/42474005870) PASS;
840 integration/134 suite, wrapper ghi đúng source SHA và ba digest đang chạy.

Xác nhận thao tác SIT là của owner; agent đối chiếu GitHub/log pipeline, không chạy lại thao tác người dùng hoặc đo NFR-8 trong lượt nghiệm thu này.
Số đo 5 lần/trung vị, thiết bị/trình duyệt của TC-733 chưa được cung cấp; phép đo chính thức giữ ở E23.
Quyết định này thay trạng thái chờ nghiệm thu E21 trong các checkpoint local trước đó.
[Biên bản và giới hạn](../../Docs/angia/acceptance/v0.3/epic21-acceptance.md).
Tiếp theo **E22-S1-T1 — Dòng thời gian thêm ba loại**; E18 giữ trạng thái riêng,
E22/E23 và phát hành v0.3/Production còn mở.

## Nghiệm thu E18 và E22 trên SIT — 2026-11-08

**PASS, đóng E18 (5/5 task, kết luận spike (b)) và E22 (4/4 task) theo xác nhận owner:** “Đã PASS, ghi biên bản”.
[PR #67](https://github.com/trinhquocthinh/angia/pull/67) đã merge; bản nghiệm thu SIT là `cb16a7b892556aebbaed2b05b94b08a1373d8671`.
[CI sau merge](https://github.com/trinhquocthinh/angia/actions/runs/42494509977) và
[pipeline SIT](https://github.com/trinhquocthinh/homelab-deploy/actions/runs/42495136267) PASS; wrapper ghi đúng source SHA và ba digest đang chạy.
Agent chạy lại `yarn verify` đầy đủ trên `cb16a7b` (PASS) và Playwright body-map 125/126; TC-692 WebKit flaky, chạy riêng 3/3 PASS.

Còn mở sang E23: header CSP không còn trên SIT tối 2026-11-08, cần đặt lại và thêm `'wasm-unsafe-eval'` có review; đo 3D trên iPhone; TC-733.
Biên bản: [E18](../../Docs/angia/acceptance/v0.3/epic18-acceptance.md), [E22](../../Docs/angia/acceptance/v0.3/epic22-acceptance.md).
Tiếp theo **E23 — Nghiệm thu v0.3, promote, đóng băng**.

## Kiểm toán E23-S1-T1 — 2026-11-08

**PASS theo owner; E23 hoàn thành 1/4 task.** Bản kiểm `cb16a7b`:
11 route `self_write` có probe cùng gia đình khác hồ sơ và khác gia đình,
kiểm `404` và snapshot DB không đổi; 24 unit kiểm kê/helper PASS;
full integration local **845/845 test, 136/136 suite PASS**.
API và worker SIT đều dùng `angia_sit_app`, không superuser, không bypass RLS
và không sở hữu các bảng RLS. Catalog SIT khớp 4 bảng đau nhức bật RLS,
29 bảng cũ có tổng 87 policy RESTRICTIVE.

`yarn verify:fast` trên bản sao tạm exit 0: typecheck đạt;
`--changed` không chọn unit test. Các phép phá policy đỏ TC-704/705
tham chiếu bằng chứng E19, không thực hiện lại trong lượt này.
[Biên bản E23](../../Docs/angia/acceptance/v0.3/epic23-acceptance.md).
Tiếp theo **E23-S1-T2** — đo NFR-8, rà SC18 và kiểm SC19.
E23 chưa đóng; Production vẫn giữ v0.2.

## Checkpoint E23-S1-T2 — cập nhật 2026-11-09

**Đang thực hiện, chưa nghiệm thu PASS; E23 giữ 1/4 task hoàn tất.**
Lượt kiểm ngày 2026-11-08 trên source `9acce6b`:

- SC18 (TC-714/725): 9/9 unit test, 3/3 tệp PASS.
- `yarn perf:budget`: PASS, TC-729 đạt; route lớn nhất 204.748 byte gzip,
  còn 52 byte dưới ngưỡng 200 KB. Đây là build local, chưa đo lại image SIT.
- `yarn verify:fast` trên bản sao tạm: exit 0, typecheck đạt;
  baseline Git sạch nên `--changed` không chọn test.
- Lighthouse 12.8.2 Mobile Slow 4G, CPU ×4 trên SIT `/` → `/login`:
  LCP 3,014 / 2,410 / 2,405 / 2,411 / 2,410 giây;
  trung vị **2,410 giây**, 1/5 lượt vượt 3 giây.
  Chưa đo các route cũ sau đăng nhập, chưa kết luận SC19 đầy đủ.
- Đã rà mẫu danh sách/chi tiết trên phiên SIT của tài khoản thử;
  chưa kết luận SC18 toàn bộ UI/bản in. Bản tóm tắt báo
  “Không tải được bản tóm tắt.” sau khi thử lại; nút in bị vô hiệu hóa.

Còn lại: 5 số đo điện thoại thật TC-733 (trung vị ≤15 giây, ≤4 chạm),
xác định/xử lý lỗi tải tóm tắt theo quy trình review và rà bản in,
hoàn tất SC18 và Lighthouse các route cũ sau đăng nhập.
CSP SIT và kiểm 3D iPhone/Android tiếp tục theo bàn giao E22.
[Biên bản E23 và bằng chứng](../../Docs/angia/acceptance/v0.3/epic23-acceptance.md).
Chưa đóng T2/E23, promote Production hoặc ghi mốc phát hành v0.3.

## Sửa lỗi chặn nghiệm thu E23 — 2026-11-09

Owner duyệt áp dụng bản sửa trong chat. API tóm tắt chưa chuyển
`currentMedications[].lastDoseAt` từ `Date` sang chuỗi ISO, khiến hồ sơ có
liều “Khi cần” trả 500. Đã sửa tại presentation, giữ `null` khi chưa ghi liều;
không đổi domain, schema DB hoặc hợp đồng API.

- Test hồi quy trên DB tạm: RED đúng lỗi 500 trước sửa; sau sửa,
  11/11 integration của tóm tắt PASS, gồm ca chặn chéo gia đình.
- `yarn verify:fast`: PASS, 18 unit được chọn. `yarn verify`: PASS,
  2.774 unit/552 tệp, typecheck/lint/format/build/budget/model check đạt.
- Caddy SIT đã khôi phục CSP cho nhánh web, thêm `'wasm-unsafe-eval'` vào
  `script-src` theo bàn giao E22. Validate/reload đạt; HTTPS trả đúng CSP;
  mô hình 3D hiển thị trên Chrome desktop sau reload.

Đây là checkpoint source local và cấu hình CSP SIT; chưa chứng minh bản sửa
API đã deploy. Còn kiểm lại tóm tắt/bản in trên image SIT mới, Lighthouse
sau đăng nhập, TC-733 điện thoại thật, 3D trên thiết bị thật và backup
Production đã restore-check/offsite. E23-S1-T2/E23-S2-T1 chưa PASS;
Production vẫn giữ v0.2.

## E25-S1-T1 — nền sáng/tối — 2026-11-11

Đã tích hợp token Design §11.2, `ThemeProvider` và lựa chọn **Sáng / Tối /
Theo máy** trong menu Tài khoản. Mặc định theo máy, theo dõi khi hệ thống đổi
nền; lựa chọn lưu tại `localStorage` với khoá `angia-theme`, không gửi server.
Storage bị chặn vẫn đổi được nền trong phiên hiện tại. Không đổi API, schema
DB hoặc thêm dependency.

Kiểm chứng local: `yarn verify:fast` PASS (2.878 test / 581 tệp); unit đọc lựa
chọn nền 7/7; E2E 12/12 trên Chromium/WebKit ở 360 px. ESLint, Prettier và
Knip PASS. Chạy lại E2E độc lập bằng:

```bash
yarn playwright test --config playwright.theme.config.ts
```

Harness dùng Vite localhost:5174, không cần API hoặc tài khoản. Phủ TC-856,
TC-857 và TC-859: nền máy, lưu qua tải lại, storage bị chặn, bàn phím, vùng
chạm ≥48 px, bản xem trước và CSS bản in nền trắng. Chưa kiểm PDF/máy in
thật, chưa chạy `yarn verify` hoặc nghiệm thu SIT/Production. **TC-858 vẫn
mở**; các màn còn màu cứng thuộc E25-S1-T2/E30-S5-T1.

Đã đồng bộ ghi chú tại bộ tài liệu ngoài repository: SDD SPEC-080, Tech Spec
§10.6, ma trận TC-856–859, Design §11.2 và Master Plan E25. Xem
[Master Plan](../../Docs/angia/11-master-plan.md). Tiếp theo **E25-S1-T2**.

## E25-S1-T2 — chuyển màu cứng sang token — 2026-11-11

Đã chuyển màu trong TS/TSX/CSS của web sang token theo Design §11.2 và §4.1,
bao gồm class Tailwind, SVG, bóng và mũi tên dropdown. Token biểu đồ và hình
người có đủ hai nền; ECharts/Three.js đọc giá trị CSS thực và cập nhật khi
`html[data-theme]` đổi. Vật liệu hình người dùng bản sao, khôi phục và giải
phóng khi tháo. Mỗi mức đau vẫn dùng cùng một màu.

Token giấy/bản in và lớp phủ ảnh giữ màu cố định. Chữ trên nền ảnh tối và
nhãn vùng che đen luôn sáng; xuất ảnh vẫn che đen, nền trắng và giữ pixel
không bị che. Không đổi API, domain, schema DB hoặc dependency.

ESLint `theme/no-hardcoded-colors` chặn hex, màu CSS dạng hàm và bảng màu
Tailwind cứng trong chuỗi TS/TSX; test tooling kiểm CSS ngoài `tokens.css`.
Các tên màu `white`/`black` trong codec là màu pixel xuất ảnh cố định theo
SPEC-080; tài liệu nguồn gốc GLB không phải stylesheet và được giữ nguyên.

Kiểm chứng trên bản sao sạch `/tmp` để tránh metadata `._*` của ổ ngoài:
unit 2.889/584 tệp PASS; Chromium/WebKit 360 px PASS 142/142, gồm 126 ca hồi
quy và 16 ca theme/ảnh. Lint, format, kiểm trùng, Knip và build PASS. Đã xem
ảnh sheet chọn vùng ở cả hai nền; review độc lập không còn finding.

```bash
yarn verify:fast
yarn playwright test --config playwright.theme.config.ts
yarn test:e2e:body-map
yarn verify
```

`yarn verify` chưa xanh: dừng tại `perf:budget`, `/my-profile` và
`/my-profile/pain/$issueId` khoảng 200,3 KB gzip, vượt ngưỡng 200 KB. Bản HEAD
trước T2 đo riêng cũng lỗi ở 200,6 KB; chưa sửa cách tải route trong task
màu. TC-861 giữ mở và cần xử lý trước PR. Build vẫn cảnh báo chunk lớn;
harness có cảnh báo ECharts disposed/Three.Clock deprecated.

TC-858 (tương phản toàn bộ route), TC-862, PDF/máy in thật và SIT/Production
chưa nghiệm thu. Tài liệu SDD, Tech Spec, TC, Design và Master Plan ghi cùng
checkpoint. Bộ `Docs/angia` nằm ngoài Git của source; chưa push/deploy.

## E25-S2-T1 — component nền dễ đọc — 2026-11-11

Đã thêm `Button`, `Field`, `Sheet`, `Card` tại `apps/web/src/shared/ui/`.
`Button` mặc định là nút thường, cần truyền `type="submit"` để gửi form;
variant `icon` yêu cầu `aria-label`. `Field` hiện bọc một input native,
liên kết nhãn/hướng dẫn/lỗi và chuyển tiếp props/ref. `Card` là khối không
tương tác. `Sheet` tái sử dụng native dialog và hook focus hiện có;
`ModalDialog`/`SidePanel` giữ API cũ.

Header/footer dùng chữ sans và vùng chạm mới: nút chính tối thiểu 56px,
chữ 20/28px; nút phụ/đóng tối thiểu 48px; chữ phụ 18/24px, nhãn/lỗi 16/24px,
focus 3px. Tiêu đề dùng rem, bố cục header chịu được chữ phóng 200%.
Card/sheet tối dùng viền thay bóng. Mở sheet 200ms, backdrop 180ms ease-out;
bỏ reveal/pop so le ở stylesheet modal chung, tắt chuyển động khi giảm motion.

Kiểm chứng trên bản sao `/tmp`: `verify:fast` PASS 124 test/28 tệp liên quan;
full unit PASS 2.891 test/585 tệp; lint/format, kiểm trùng, Knip và build PASS.
E2E Chromium/WebKit 360px: component 24/24, theme 16/16 PASS. Hồi quy modal
125/126 qua lượt đầu; ca còn lại bị reload trong lúc codegen và PASS khi chạy
riêng sau codegen. Unit Field tại source sau áp dụng PASS 2/2; 17/17 tệp
khớp bản kiểm chứng. Đã xem ảnh modal hai nền.

```bash
yarn playwright test --config playwright.ui-foundation.config.ts
yarn playwright test --config playwright.theme.config.ts
yarn test:e2e:body-map
yarn verify:fast
yarn verify
```

Full `verify` còn dừng ở budget hai route self: **200,9 KB/200 KB**
(checkpoint T2: 200,3 KB). TC-861 giữ mở; bước `model:check` sau budget chưa
được chạy trong chuỗi này. Còn cảnh báo chunk lớn, ECharts disposed,
Three.Clock deprecated và hai gợi ý Knip có sẵn cho identity spike.

Phạm vi này là nền cho E25-S3/E30; chưa chuyển mọi màn sang primitive,
chưa bỏ Newsreader toàn app hoặc nghiệm thu NFR-9/TC-858/862 toàn route,
focus chạm Safari, zoom hệ điều hành, điện thoại thật hay SIT/Production.
Không đổi API, domain, DB hoặc dependency. Review độc lập không có finding.
Bộ `Docs/angia` được cập nhật riêng ngoài Git source; chưa push/deploy.

## E25-S3-T1 — dữ liệu Liều hôm nay — 2026-11-11

`features/today/application/useTodayReminders.ts` nhận adapter, phiên và
`TodayTarget | null`. Đích `self` dùng hồ sơ liên kết; đích `profile` dành cho
`main` chọn hồ sơ trong cùng nhà. Hook chỉ bật khi có nhà, đúng phạm vi truy
cập và hồ sơ `confirmed`; khi `enabled = false`, `data` được che dù cache còn
bản cũ. API vẫn kiểm quyền và đồng thuận ở máy chủ.

Hook trả snapshot lời nhắc hôm nay theo ngày Việt Nam, theo thứ tự
Sáng/Trưa/Chiều/Tối, giữ nguyên thuốc, `confirmation`, `canConfirm`, `canUndo`.
Không dựng liều từ danh sách thuốc hiện dùng. Khóa cache dùng chung với
`/my-profile` và tab Thuốc, phân biệt tài khoản/nhà/hồ sơ/ngày.

`createTodayRepository` bổ sung đọc tự xem, tái sử dụng đọc theo hồ sơ và
ghi/hủy SPEC-046. Consumer tiêm cùng adapter vào `useDoseConfirmation` cho
từng lời nhắc; hook này khóa bấm lặp và chờ đọc lại dữ liệu máy chủ để hiện
người xác nhận và giờ. Hook đọc không tự chọn hồ sơ hay đổi điều hướng.

Kiểm chứng: 10 test mới PASS; 35 test liên quan today/doseConfirmations PASS.
`yarn verify:fast` PASS trên bản sao sạch `/tmp` (typecheck + 10 test/2 tệp).
Chạy ở ổ nguồn bị metadata macOS `._*` có sẵn làm Vitest lỗi parse; không
dọn metadata ngoài phạm vi task. Lint toàn repo trên bản sao sạch, format
phần thay đổi, kiểm trùng và Knip PASS; Knip còn hai gợi ý identity spike
đã có. Hai entry Knip tạm giữ API
today dùng ở T2; bỏ entry khi màn mới trở thành consumer thực tế.

```bash
yarn vitest run --project unit-web apps/web/src/features/today apps/web/src/features/doseConfirmations
yarn verify:fast
```

Chưa có giao diện/route mới; TC-852/853 chỉ được kiểm ở lớp dữ liệu, chưa
PASS E2E của SPEC-079. Không đổi API/domain/DB/dependency. Chưa chạy full
`yarn verify`, chưa đánh giá lại budget còn mở từ E25-S2-T1 hoặc SIT/Production.
Tiếp theo E25-S3-T2.
