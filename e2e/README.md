# Playwright SIT — E13-S2-T2

TC-092 chạy upload JPEG qua UI → sanitize/OCR thật → kiểm form điền đúng bản trích xuất → đối soát/sửa bằng UI theo đáp án ảnh → duyệt → kiểm API chuỗi, SVG biểu đồ và bảng số liệu đi kèm. Ba số đo nền tạo qua API thật để đạt ngưỡng bốn điểm render biểu đồ. Ngày/giờ được người duyệt điền bằng UI vào hôm nay; mọi trường OCR cần sửa được ghi annotation `ocr-correction`, không đổi đáp án ảnh hoặc bỏ bước OCR. Ca này tiêu thụ một lượt OCR và ngân sách thật; không tự retry. Đây là ca luồng đối soát, không thay thế phép đo độ chính xác OCR của bộ golden.

TC-093 chạy trên Chromium desktop và WebKit mô phỏng iPhone: thuốc, xét nghiệm và 13/100 ngày đo được tạo qua API thật trong hồ sơ tạm. Kiểm nút in, CSS in và đủ ngày đo. Chromium tạo PDF từ trang thực tế, kiểm A4, một trang cho bản ngắn/nhiều trang cho bản dài, đủ ngày đo và chân trang miễn trừ/ngày tạo trên từng trang. WebKit kiểm DOM/CSS in; không thay thế nghiệm thu hộp thoại In/Lưu PDF trên Safari iOS thật.

## Chạy từ máy trạm

Tooling đọc PDF cần Node.js ≥22.13.0; `.nvmrc` chọn nhánh Node 22.

```bash
yarn install --immutable
yarn build:contracts
yarn playwright install chromium webkit
mkdir -p .playwright/auth
cp .env.e2e.example .env.e2e
yarn e2e:auth
```

Đăng nhập bằng tài khoản `main` thuộc **gia đình thử riêng**, không dùng hồ sơ/dữ liệu gia đình thật. Sau khi đăng nhập thành công, đóng cửa sổ codegen để lưu phiên. Ghi UUID `family.id` từ `GET /api/me` vào `E2E_FAMILY_ID` trong `.env.e2e`; không ghi cookie/CSRF vào tài liệu.

Điền `E2E_READING_JPEG` bằng đường dẫn JPEG máy đo huyết áp đã loại bỏ định danh. `E2E_READING_EXPECTED` trỏ tới JSON chứa đúng số trên ảnh, ví dụ:

```json
{ "systolic": 153, "diastolic": 99, "pulse": 69 }
```

```bash
yarn test:e2e --list
yarn test:e2e
# Chỉ kiểm bản in, không gọi OCR:
yarn test:e2e tc093
```

Không chạy E2E mặc định trong `yarn verify:fast`/`yarn verify`: bộ này cần phiên SIT, Worker và OCR thật. Test thiếu cấu hình, sai role/family, phiên hết hạn hoặc OCR chuyển nhập tay/chờ ngân sách phải báo lỗi; không skip để tạo kết quả xanh.

## Ghép vào luồng push sit

Luồng giữ nguyên ranh giới hai repo:

`angia push sit → CI verify → dispatch SHA → homelab-deploy validate/build/deploy → e2e-sit`

Job `e2e-sit` nằm trong `.github/workflows/angia-sit.yml` của repo private, sau `deploy-sit`, checkout source public theo `verified_sha` trên GitHub-hosted runner. Nó dùng cùng concurrency của toàn workflow để lần deploy SIT kế tiếp không chen vào. Không checkout/chạy source public trên runner deploy. Kết quả E2E nằm trong workflow private; CI public thành công chỉ chứng minh phần verify/dispatch.

E2E thất bại làm workflow private thất bại; SIT đã deploy vẫn giữ bản đang chạy để điều tra. Không tự rollback hoặc đổi workflow promote Production trong subtask này.

Chuẩn bị ở `homelab-deploy` trước lượt push đầu tiên:

1. Thêm fixture không định danh `fixtures/angia-e2e/reading.jpg` và đáp án `expected.json` vào repo **private**. Job lấy fixture từ đúng commit control-plane đang chạy; không đưa ảnh vào repo public.
2. Đặt repository variable `ANGIA_E2E_FAMILY_ID` bằng UUID gia đình thử riêng.
3. Đặt repository secret `ANGIA_E2E_STORAGE_STATE_BASE64` bằng base64 của storage state còn hạn. Chỉ giữ cookie của hostname `angia-sit.toniboy.io.vn` và origin SIT; không dùng phiên cá nhân/phiên IdP cho CI. Ví dụ truyền trực tiếp vào GitHub, không in ra terminal:

```bash
# Chạy tại checkout homelab-deploy; đường dẫn auth phải trỏ tới tệp riêng còn hạn.
node --input-type=module <<'JS' | gh secret set ANGIA_E2E_STORAGE_STATE_BASE64
import { readFileSync } from 'node:fs';
const state = JSON.parse(readFileSync('/absolute/path/sit.json', 'utf8'));
const origin = 'https://angia-sit.toniboy.io.vn';
state.cookies = state.cookies.filter((c) => c.domain.replace(/^\./, '') === new URL(origin).hostname);
state.origins = state.origins.filter((o) => o.origin === origin);
if (!state.cookies.length) throw new Error('Không có cookie SIT');
process.stdout.write(Buffer.from(JSON.stringify(state)).toString('base64'));
JS
gh variable set ANGIA_E2E_FAMILY_ID --body '<UUID gia đình thử>'
```

Làm mới secret sau khi phiên hết hạn/tài khoản bị thu hồi. Tài khoản tester tạm chỉ phục vụ kiểm local; trước khi xóa tài khoản này, cấu hình tài khoản E2E duy trì riêng cho các lượt CI tiếp theo. Không thêm endpoint bỏ qua xác thực hoặc cấp role DB owner cho test.

## Dọn dữ liệu và bằng chứng

Mỗi test tạo hồ sơ `E2E-<UUID>` mới, xóa chính hồ sơ đó trong teardown bằng API (kèm CSRF và tên xác nhận). Không quét/xóa hồ sơ có sẵn. Teardown vẫn chạy khi assertion thất bại; nếu runner bị kill, phiên bị thu hồi hoặc API hỏng, owner kiểm danh sách `E2E-*` và xóa đúng hồ sơ còn sót qua ứng dụng. Không coi hủy job là bằng chứng đã dọn dữ liệu.

`.playwright/` và `.env.e2e` được gitignore. Trace/video/screenshot tắt để tránh thu cookie/header/ảnh thật. CI chỉ upload HTML report và PDF dữ liệu giả, ở repo private, giữ ba ngày; tệp phiên nằm ngoài các thư mục artifact và được xóa ở bước `always()`. Không copy ảnh/phiên vào issue, PR public hoặc log.

Trên macOS, report/results mặc định nằm tại `<os.tmpdir()>/angia-playwright/` để tránh lỗi AppleDouble `._*`/`ENOTEMPTY` khi repo trên volume ngoài; Linux CI dùng `.playwright/`. Có thể đặt `E2E_ARTIFACT_DIR` thành một thư mục local khác.

`timeout-minutes: 8` là giới hạn riêng job E2E, chưa phải bằng chứng toàn pipeline đạt ngân sách tám phút trong Test Cases §CI. Cần đo lần chạy thực tế; build/deploy hiện hành nằm trước E2E.

Tài liệu tham chiếu: [Playwright authentication](https://playwright.dev/docs/auth), [CI](https://playwright.dev/docs/ci-intro), [page.pdf](https://playwright.dev/docs/api/class-page#page-pdf).

## TC-721 — BodyMap2D local

Bộ kiểm tra này nằm tại `apps/web/e2e/bodyMap2D.spec.ts`, dùng cấu hình `playwright.body-map.config.ts` riêng và không chạy trong bộ SIT mặc định hoặc `yarn verify`. Harness chỉ dùng dữ liệu giả, không cần API hoặc phiên đăng nhập.

```bash
yarn playwright install chromium webkit
yarn test:e2e:body-map
```

Lệnh tự mở Vite trên `127.0.0.1:5174` và chạy Chromium cảm ứng/WebKit mô phỏng điện thoại tại viewport 360 px. Kiểm đủ 59 nút hai mặt/35 vị trí: vùng chạm ≥ 44 × 44 px, khoảng cách ≥ 8 px, callback đúng vùng/bên, bàn phím/focus, giữ lựa chọn và chấm theo dõi. Kiểm thêm khung 296 px không tràn ngang. Kết quả local E21-S1-T2: 8/8 PASS; không thay thế nghiệm thu điện thoại thật, trình đọc màn hình hoặc SIT. Báo cáo nằm trong thư mục tạm của hệ điều hành, không ghi dữ liệu thử vào SIT.

## TC-720 — RegionList local

`apps/web/e2e/regionList.spec.ts` dùng chung lệnh `yarn test:e2e:body-map` và harness trên, mở chế độ danh sách qua `?view=list`. Chỉ chạy TC-720: `yarn test:e2e:body-map regionList`.

Kiểm đủ 35 vị trí, ba nhóm “Đầu và thân” (7), “Tay” (12), “Chân” (16), nhãn và trạng thái trong cây accessibility; Tab vào/ra nhóm radio, mũi tên xuống/lên, quay vòng, Enter/Space và cập nhật lựa chọn từ prop. Kết quả local E21-S1-T3: 4/4 PASS trên Chromium/WebKit. Đây là kiểm thử cây accessibility tự động, chưa nghiệm thu trình đọc màn hình thật. Không chạy TC-720/721 trong `yarn verify`; cần chạy lệnh Playwright riêng.

## TC-722/728 — NewPainIssueSheet local

`apps/web/e2e/newPainIssue.spec.ts` dùng chung cấu hình local phía trên. Chạy riêng: `yarn test:e2e:body-map newPainIssue`. Harness `/e2e/newPainIssue.html` không nằm trong route hoặc build sản phẩm; các phản hồi API đều giả lập, không cần dữ liệu sức khỏe thật hoặc phiên SIT.

Sáu ca trên mỗi engine Chromium/WebKit kiểm tra: chọn vùng đang theo dõi từ 2D/danh sách không gửi POST; 409 giữ mức 6 và ghi chú qua callback, không tự ghi thêm; đổi vùng/lỗi mạng/409 thiếu ID giữ bản nháp và đóng trả focus bàn phím; tạo qua main/self và bố cục 360/1440 px; mất đồng thuận khi đang lưu bỏ phản hồi muộn; workspace mở sheet qua callback bàn giao. Bộ local đầy đủ có 24 ca, gồm hồi quy TC-720/721; không chạy trong `yarn verify`.

Đây là kiểm chứng ranh giới callback của E21-S2-T2. Nơi nhận `onContinueIssue` phải mở chi tiết/ghi nhanh, giữ `draft` và hiển thị `message` nếu có ở T3/T4. Route thật chưa truyền callback nên chưa hiện nút tạo mặc định; không coi harness là nghiệm thu luồng đầu cuối hoặc 3D/SIT.

## TC-723 — QuickPainEntrySheet local

Chạy riêng `yarn test:e2e:body-map quickPainEntry`; chạy cả hồi quy `yarn test:e2e:body-map`. Harness `/e2e/quickPainEntry.html` dùng workspace thật với dữ liệu/API giả, không đưa vào route hoặc build sản phẩm. Không cần phiên SIT.

Bảy ca mỗi engine kiểm: bốn chạm (tab giả lập → Ghi mức → chấm → Lưu), không chọn sẵn và không cần chọn ngày; phím số/mũi tên, kích thước ≥44 px và bố cục theo vùng chứa 512 px ở viewport 360/480/768/1440; 409 đã khỏi giữ bản nháp và chỉ mở lại sau khi bấm; self/lỗi mạng/thời điểm tương lai; bản nháp từ 409 tạo vấn đề sang sheet không tự ghi; hủy khi mất đồng thuận/khóa đóng khi lưu; đổi tài khoản xóa trạng thái và đóng trả focus. Kết quả local E21-S3-T1: 14/14 mới, 38/38 cả bộ Chromium/WebKit PASS.

Từ T3, workspace có nơi nhận bàn giao mặc định và route hồ sơ hiện nút tạo/ghi khi đủ quyền. Callback ngoài vẫn dùng được cho nơi nhúng riêng. Đây là kiểm chứng local có API giả; chưa nghiệm thu route sản phẩm, thời gian ≤15 giây trên điện thoại thật, trình đọc màn hình hoặc SIT. Bộ này chạy riêng, không nằm trong `yarn verify`.

## TC-726 — Chi tiết vấn đề đau local

Chạy riêng `yarn test:e2e:body-map painIssueDetail`; chạy cả hồi quy `yarn test:e2e:body-map`.
Harness `/e2e/painIssueDetail.html` dùng component, hook và adapter thật với API giả; không đưa vào build sản phẩm.

Chín ca mỗi engine kiểm người ghi/sửa và tài khoản đã xóa, giờ Việt Nam, thứ tự mới nhất trước,
lịch sử trạng thái, ghi nhanh tại chỗ, sửa/xóa ghi chú, focus bàn phím, xác nhận xóa,
ẩn xóa lần ghi cuối và lỗi cạnh tranh `422 last_entry`, sửa vấn đề đã khỏi và giới hạn ngày khỏi,
lỗi mạng giữ bản nháp, 404 về danh sách, self endpoint, đổi tài khoản và mất đồng thuận khi đang gửi.
Không thay thế nghiệm thu điện thoại/trình đọc màn hình thật hoặc API live/SIT.

## TC-724/725 — Biểu đồ vấn đề đau local

Chạy riêng `yarn test:e2e:body-map painIssueChart`; cả hồi quy: `yarn test:e2e:body-map`.
T2 dùng lại harness `/e2e/painIssueDetail.html`, component/hook/adapter thật và API giả,
không đưa trang kiểm thử vào build sản phẩm. Đồng hồ cố định ở 20/11/2026 và múi giờ trình duyệt
America/Los_Angeles để kiểm dữ liệu vẫn hiển thị theo giờ Việt Nam.

Sáu ca mỗi engine Chromium/WebKit kiểm đủ điểm và hai đoạn SVG ngắt qua >7 ngày,
nhãn đợt thuốc và tooltip khi chạm điểm/liều “Khi cần”, không tràn ngang 360 px,
lọc 4/12/26 tuần gửi đúng khoảng và endpoint self, ít điểm dùng thẻ/bảng ẩn và không nạp canvas,
lỗi bối cảnh/thử lại/rút đồng thuận, ghi nhanh từ 3 thẻ sang 4 điểm kèm làm mới bối cảnh.
Ca desktop 1440 px kiểm chiều cao canvas và chuyển chạm từ điểm đau sang vạch liều thuốc
mà không bị tooltip che; hồi quy này đã tái hiện lỗi trước khi sửa vị trí tooltip lên phía trên điểm.
Ca TC-724 lưu ảnh biểu đồ trong output tạm của Playwright.

Unit TC-724 kiểm biên đúng 7 ngày lịch, hơn 7 ngày qua nửa đêm Việt Nam, lọc hai biên ngày và giữ đủ điểm.
TC-725 kiểm kiểu điểm/nét cố định ở mức 1/10 và quét nội dung hệ thống ở thẻ/danh sách/chi tiết/biểu đồ
bằng danh sách từ cấm chung; không lọc lời tự ghi của người dùng.
Không thay thế nghiệm thu điện thoại/trình đọc màn hình thật, bản in hoặc API live/SIT.

Kết quả local E21-S4-T2: 12/12 ca biểu đồ và 68/68 cả bộ Chromium/WebKit PASS (66 mobile, 2 desktop).
Unit riêng sổ đau nhức 92/92 PASS; full verify 2.726 unit/535 suite PASS trên bản sao sạch.

## E21-S4-T3 — Bài tập local

Chạy riêng `yarn test:e2e:body-map exerciseNote`; cả hồi quy `yarn test:e2e:body-map`.
Dùng harness chi tiết hiện có và API giả. Tám ca mỗi engine kiểm thẻ/nguồn chữ/ngày/audit,
nguồn không chọn sẵn và ngày Việt Nam, đổi self xóa người chỉ định, PATCH null xóa ngày,
tracking/resolved và rỗng, lỗi giữ bản nháp/thử lại/ngày kết thúc, endpoint self/đổi tài khoản,
mất đồng thuận/hủy/phản hồi muộn/gửi lặp; kiểm thêm trả focus, giữ bản nháp ghi nhanh,
nút lưu và cuộn ô ghi chú không bị footer che ở 360 px.
Kết quả: 16/16 ca bài tập và 84/84 cả bộ Chromium/WebKit PASS local.
Không thay thế integration HTTP/DB, thiết bị/trình đọc màn hình thật hoặc SIT.
