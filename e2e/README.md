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
