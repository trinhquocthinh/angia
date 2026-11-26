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

## Giao diện đăng nhập — 2026-11-17

`/login` dùng bố cục desktop hai cột, mobile một cột và nền gia đình đất sét.
Trang đăng ký `/register` dùng chung layout và nút có ripple/loading của login;
field và CSS của form đăng ký nằm trong `Registration*` và `registration-form.css`.
Đổi mật khẩu và enrollment giữ layout hiện có. Token màu login
có cả nền sáng/tối tại `shared/styles/tokens.css`.
Mặc định toàn web dùng nền sáng khi chưa lưu lựa chọn; vẫn giữ lựa chọn sáng/tối/theo máy do người dùng tự chọn.
Desktop căn giữa block tối đa 1280 px, nền phủ viewport; mây trôi và hiệu ứng bấm/loading lấy từ màn Stitch `f39345d438f942de8056e0b4350d3d79`, loading bám request thật và hỗ trợ giảm chuyển động.

Asset lấy từ Stitch Project An Gia `12209147960511107004`: desktop
`05630ed0952b4dd88affce877bc9ad26`, mobile `edc84c4692e14151bdd66c84fa02fa43`.
Nền gốc 1376 × 768 và logo được tối ưu WebP tại `apps/web/public/images/login/`;
SVG desktop và Authentik giữ hình dạng từ thiết kế. Icon mobile là subset Material
Symbols lưu local tại `public/fonts/material-symbols/login-outlined.ttf`, cùng
giấy phép Apache 2.0 trong thư mục đó. Login không gọi CDN ảnh hoặc font lúc chạy.
Owner duyệt cập nhật icon 3D ngày 2026-11-18: desktop lấy từ màn
`f39345d438f942de8056e0b4350d3d79`, mobile từ `b91f19cefbd648208efc22fae503db8b`.
Chín SVG gốc lưu tại `apps/web/public/images/login/clay/`: desktop có lịch, tim,
gia đình, ổ khóa, người dùng và chìa khóa; mobile có ổ khóa, avatar và chìa khóa
riêng. `LoginClayIcon` chọn ảnh bằng `picture` tại breakpoint 1024px. Các SVG 3D
thay icon nét/phông ở các vị trí này; mắt hiện/ẩn, mũi tên, Authentik và icon phụ
tiếp tục dùng tài nguyên hiện hành. Cờ `clayIcons` bật ở cả `/login` và `/register`:
ba thẻ tiện ích dùng chung SVG 3D lịch, tim và gia đình. Kiểm tra ảnh theo breakpoint,
hiện/ẩn mật khẩu và chữ 200% tại `apps/web/e2e/loginClayIcons.spec.ts`, dùng cấu
hình `playwright.account.config.ts` sau khi build web.
Mobile dùng nền mint và hai SVG mây từ màn Stitch mobile; không hiển thị ba
block tiện ích dưới form đăng nhập/đăng ký. Các block bên trái desktop dùng chung.
Form đăng ký có thanh độ mạnh mật khẩu bốn mức theo mẫu Stitch; điểm chỉ là tham khảo,
không thay quy tắc ít nhất 8 ký tự và khác tên đăng nhập. Hai liên kết pháp lý luôn
gạch chân và dùng URL/phiên bản từ API. Form trống/lỗi có hiệu ứng rung, tôn trọng
thiết lập giảm chuyển động. Không thay nghiệp vụ đăng ký local, thêm số điện thoại
hay luồng đăng ký Authentik.

Owner duyệt cập nhật **chỉ icon form đăng ký** ngày 2026-11-18 từ màn Stitch
`36f3713e39b84fdab8739e790faaaba5`: 5 SVG tại `apps/web/public/images/register/clay/`
gồm tiêu đề tạo tài khoản, avatar hồng, chìa khóa vàng, thẻ tên xanh lá và email
xanh dương. Form responsive dùng cùng bộ icon màu; bỏ mask đơn sắc và glyph
mobile ở bốn ô nhập. Chuẩn hóa tên thẻ/thuộc tính SVG khi trích từ HTML để gradient
đọc đúng trong tệp độc lập. Theo yêu cầu tiếp theo của owner, cột trái register
dùng lại ba icon 3D của login, giữ năm icon form vừa cập nhật. Bố cục, chữ, nút,
checkbox, mắt hiện/ẩn và nghiệp vụ giữ nguyên. Ca `accountRegistrationClayCase.ts`
kiểm cả hai nhóm icon, hiện/ẩn mật khẩu, thanh độ mạnh và chữ 200%.

Form vẫn đăng nhập local qua `/api/auth/password-login`; nút **Đăng nhập bằng
Authentik** vẫn trỏ `/api/auth/login`. Không thay backend, schema, chính sách phiên,
enrollment hay điều hướng sau xác thực. Không thêm đăng nhập số điện thoại, sinh
trắc hoặc lựa chọn ghi nhớ phiên. Liên kết `/forgot-password` giữ nguyên; màn khôi
phục tương ứng chưa được triển khai.

## Giao diện cập nhật điều khoản — 2026-11-17

`/account/legal-update` dùng layout một cột riêng: desktop tối đa 540 px, mobile
hiển thị đầy đủ tên văn bản và ngày phiên bản. Nền mint có ba quầng ambient chạy
18/22/20 giây trên desktop, đứng yên trên mobile và khi bật giảm chuyển động.
SVG desktop giữ theo Stitch; sáu icon mobile lưu local tại
`public/fonts/material-symbols/legal-update-outlined.ttf`.

URL/ngày văn bản lấy từ API hiện hành. Nút đồng ý theo request thật, khóa khi đang
gửi hoặc thiếu văn bản/CSRF; luồng ghi nhận phiên bản, đồng ý lại và đăng xuất giữ
nguyên. Các style `legal-update-*` và token màu riêng không đổi layout các trang
khác. Tham chiếu Stitch: desktop `54449e0d704649b1be3c951e7bea9024`, mobile
`86f7ce7d28c941db9f555b6e20d17a2a`.

## Điều hướng theo vai trò — E30-S1-T1 (2026-11-25)

Chủ hộ và Đồng quản lý (`main`) có bốn mục: Hôm nay (`/`), Hồ sơ
(`/?view=profiles`), Giấy tờ (`/review`), Nhà (`/family/home`). Thành viên
(`member`) có Hôm nay, Hồ sơ của tôi (`/my-profile`), Nhà; áp dụng cả khi chưa
liên kết hồ sơ. Chưa có nhà và trang `/admin` không có điều hướng gia đình.
Điều hướng không thay thế kiểm tra quyền tại route/API.

Giấy tờ mở hàng chờ duyệt và có nút **Chụp / chọn ảnh** dẫn tới `/upload`.
Huy hiệu sử dụng số giấy tờ từ các trang hàng chờ đã tải, không có số giả.
Các màn con giữ mục cha được chọn; `/` phân biệt với `/?view=profiles`.

Mobile dưới 768px dùng thanh đáy tối thiểu 64px + safe area, icon 28px kèm
nhãn chữ; tablet 768–1023px dùng rail trái 88px. Desktop từ 1024px giữ nhóm
điều hướng pill trong header bo tròn theo ảnh owner duyệt ngày 2026-11-25,
**thay cho sidebar 240px trong Design §11.5 ban đầu**. Màu lấy từ token sáng/tối,
vùng chạm tối thiểu 48px, footer chừa khoảng cho thanh đáy. Bộ điều hướng dùng
chung nằm tại `apps/web/src/shared/layout/`.

Menu tài khoản chỉ giữ lối điều hướng và thao tác tài khoản; lựa chọn nền
sáng/tối/theo máy đặt tại `/account`, không lặp trong menu. Nút tài khoản desktop
có padding 10px dọc, 16px ngang và khoảng cách tên/avatar 12px.

Icon menu là PNG 3D alpha 40px; chuông thông báo 30px, không có tile/viền/nền
riêng phía sau icon. Chuông rung một lần khi hiện và hai nhịp khi hover/focus;
giảm chuyển động tắt hiệu ứng. Không có số thông báo giả. Nguồn và dẫn xuất
ghi tại `apps/web/public/images/account-menu/SOURCES.md`.
Menu dùng tên mục đậm và mô tả phụ một dòng: Nhà của tôi / Thành viên & thông tin nhà;
Hồ sơ của tôi / Thuốc & sức khoẻ của bạn; Quản lý tài khoản / Bảo mật & cài đặt;
Đăng xuất / Thoát khỏi thiết bị này. Mục đang chọn có nền mint; hai dòng Đăng xuất
màu danger. Hồ sơ dùng thẻ y tế vàng–mint. Quản lý tài khoản dùng bánh răng gốm
xanh/lõi vàng từ Stitch `3410b9d76cf74777a7cfc178f17a5163`, asset riêng
`account-settings-3d.png`; Quản trị hệ thống giữ `settings-3d.png`.

Kiểm tra trình duyệt bằng
`yarn playwright test --config playwright.account.config.ts apps/web/e2e/mobileBottomNav.spec.ts`
(build web trước): quyền, route đang chọn, lối tải ảnh, hai nền, Chromium/WebKit,
360/768/1024/1440px và phóng chữ 200%. Chưa nghiệm thu SIT hoặc toàn bộ Epic 30.

## Cỡ chữ Chuẩn / Chữ lớn — cập nhật UI 2026-11-26

Trong **Tài khoản → Cỡ chữ**, công tắc **Chữ lớn** mặc định tắt. Chuẩn dùng nội
dung/ô nhập 16px, nhãn/tab 14px, chữ nút 14px và h1 24px; bật Chữ lớn tương ứng
18/16/16/26px. Token chiều cao nút `min-h-btn` là 46px ở Chuẩn và 56px ở Chữ lớn
(theo UI owner duyệt 2026-11-26). Lựa chọn lưu trên thiết bị bằng `angia-large-text`, dùng chung
trong trình duyệt này, không gửi server. Storage bị chặn vẫn đổi được trong
phiên. Hai nền sáng/tối dùng cùng thang chữ.

Token tại `shared/styles/typography.css`; provider và tiện ích tại
`shared/accessibility/`. Dùng utility ngữ nghĩa `text-body`, `text-caption`,
`text-button-primary`, `text-button-secondary`, `text-heading-1`,
`text-heading-2`, `text-display` thay cho cỡ chữ cứng. Biểu đồ đọc cỡ thực từ
token; icon, ảnh và bản in A4 giữ nguyên. Nút dùng token chiều cao theo chế độ chữ. Phóng chữ trình duyệt
hoạt động độc lập; không đổi root font-size để thu nhỏ toàn giao diện.

Kiểm tra: `yarn verify:fast`; sau build web chạy
`yarn playwright test --config playwright.account.config.ts apps/web/e2e/textSize.spec.ts`.
Kiểm component/modal và bản in bằng các bộ `uiFoundation.spec.ts`, `theme.spec.ts`.

## Hồ sơ — E30-S1-T2, UI owner duyệt 2026-11-26

Danh sách `/?view=profiles` và mục lục `/profiles/:id` dùng thẻ Bento, avatar
chữ cái và bộ icon 3D cục bộ. Các mục dùng thẻ điều hướng có nhãn, trạng thái
đang chọn và cuộn ngang trên màn hẹp. Màn số đo mở bằng
`/profiles/:id?section=health`; các route con hiện có giữ nguyên. Hero định danh
được dùng chung cho hồ sơ gia đình và Hồ sơ của tôi. Nguồn icon ghi tại
`apps/web/public/images/profile-sections/SOURCES.md`.

Dữ liệu số thuốc/liều tiếp theo trên thẻ chưa được thêm vì API danh sách chưa
cung cấp. Mục lục dùng mô tả tĩnh, không giả lập số liệu. Hiển thị số đo theo
BR-049; mục Người giám hộ theo SPEC-070 (hồ sơ dưới 18 tuổi chưa liên kết,
người thao tác là main). Những thẻ thuốc, số đo, xét nghiệm, lịch hẹn, nhiệt độ,
dòng thời gian và sổ đau nhức được đồng bộ cách trình bày; giữ nguyên nghiệp vụ.

**Quyền Thành viên giữ nguyên BR-005/SPEC-042:** chỉ tự xem các mục hiện có
của hồ sơ liên kết; chưa có bản tóm tắt in, lịch sử chứng từ/ảnh đơn thuốc hay
chức năng tải ảnh đơn thuốc, phiếu xét nghiệm, máy đo. Owner xác nhận tạm thời
không mở rộng các quyền này. Không đổi API, domain, DB schema hoặc dependency.

Kiểm tra trước commit (2026-11-26): `yarn verify:fast` PASS (300 test),
web unit PASS (1.890 test), lint/build/typecheck/format PASS. Budget mọi route
≤200 KB gzip, TC-729 PASS. E2E mục lục/cỡ chữ 39/39 và Hồ sơ của tôi 18/18 PASS.
Chưa chạy full `yarn verify` cho checkpoint này.

Owner đã duyệt UI local; chưa tương đương nghiệm thu toàn bộ Epic 30,
kiểm tra SIT/Production hoặc deploy. Tài liệu thiết kế và master plan chi tiết
nằm tại `../../Docs/angia/` (ngoài Git repo này).

## Nhắc thuốc — E30-S2-T1, UI owner duyệt 2026-11-26

Ba route `/profiles/:id/reminders`, `/reminders/:id` và
`/revisit-reminders/:id` dùng thẻ Clay Bento, icon cục bộ, tiêu đề Newsreader,
token sáng/tối và nút Chuẩn/Chữ lớn 46/56px. Cài đặt có liên kết quay về đúng hồ
sơ và tới `/notifications`; không giả trạng thái Push hoặc số ngày thuốc còn lại.
Giữ nguyên giờ tăng dần, buổi trống, người nhận cố định của hồ sơ liên kết,
người giám hộ của trẻ, quyền xác nhận cả buổi/hủy và quyền mở tóm tắt đi khám.
Không đổi API, domain, schema hoặc dependency.

Owner đã xác nhận UI PASS ngày 2026-11-26 và yêu cầu cập nhật tài liệu, commit.
Bản cuối có hero hồ sơ và số buổi từ dữ liệu đã lưu, ô giờ dùng icon buổi chung,
thẻ người nhận có avatar, minh họa màn hình khóa không chứa định danh và các
trạng thái tải/lỗi/đã xác nhận đồng bộ theo token. Danh sách thuốc và đơn tái khám
tách component; số thuốc/số đơn lấy từ response, không dựng số ngày còn thuốc.

Seed phục vụ duyệt UI: `yarn dev:seed:reminders tester tester1`.
Chỉ dùng DB `angia_dev` với role `angia_dev_app` NOBYPASSRLS; tạo hồ sơ mẫu rỗng,
có dữ liệu, hồ sơ trẻ và bổ sung dữ liệu mẫu còn thiếu cho hồ sơ liên kết của
Thành viên được chỉ định. Không đổi quyền hoặc liên kết tài khoản. Script in
đường dẫn từng màn sau khi transaction commit. Xem [hướng dẫn seed](scripts/dev/README.md).

Kiểm local: 74 unit web liên quan và 6 unit kiểm cấu hình seed PASS;
build/typecheck/lint PASS; budget mọi route ≤200 KB gzip, TC-729 PASS.
`yarn verify:fast` PASS: typecheck toàn workspace và 4.116 test/823 tệp.
E2E `reminders.spec.ts` 30/30 PASS trên Chromium touch/desktop và WebKit touch:
lưu từ rỗng, validation, người nhận liên kết/giám hộ, xác nhận/hủy, quyền xem,
hai nền/hai cỡ chữ ở 360/768/1024/1440px và phóng chữ 200%.
Axe kiểm nội dung ba màn ở 360px/Chữ lớn/hai nền: 0 serious/critical.
Checkpoint seed ban đầu đã đối chiếu chạy lại trên DB dev: không thay đổi dòng
hiện có; use case/repository thật kiểm quyền main/member và RLS PASS. Bản seed
cuối bổ sung đường dẫn đã xác nhận/tái khám cho hồ sơ liên kết; không nạp lại DB
trong lần cập nhật tài liệu/commit này để giữ trạng thái UI owner vừa duyệt.
UI local đã được owner duyệt; chưa full `yarn verify`, PR hoặc deploy.
Không suy từ duyệt UI thành nghiệm thu toàn bộ SPEC-081/Epic 30 hoặc TC-876 mọi route.
Bằng chứng chi tiết: `../../Docs/angia/acceptance/v1.0/evidence/e30-s2-t1-2026-11-26.md`.

## Quản trị hệ thống

Tài khoản có quyền quản trị hệ thống truy cập `/admin` để tạo nhóm gia đình, tìm tài khoản, gán nhóm, đổi vai trò và gỡ tài khoản khỏi nhóm. Quản trị hệ thống chưa có nhóm vẫn truy cập được trang này; tài khoản thường chưa có nhóm được chuyển đến màn Bắt đầu để tự tạo nhà. API kiểm tra quyền và các ràng buộc thành viên, bao gồm việc giữ ít nhất một Quản trị chính trong nhóm.

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

### E25-S3-T2 — Màn Liều hôm nay (local)

Route `/` mở Liều hôm nay cho tài khoản có hồ sơ liên kết và người chăm sóc
chính có nhà. Danh sách hồ sơ và các thao tác đồng thuận hiện có vẫn truy cập
qua nút Hồ sơ gia đình tại `/?view=profiles`; có nút Hôm nay để quay lại.
Tài khoản chưa có nhà hoặc thành viên chưa liên kết giữ luồng trước đó.

`main` có bộ chọn hồ sơ dạng chip; mặc định là hồ sơ liên kết của chính tài
khoản. Nếu chưa liên kết thì cần chọn hồ sơ, không tự chọn người khác. Mỗi
buổi có tên, giờ Việt Nam, snapshot thuốc/liều và nút Đã dùng toàn chiều
rộng, cao tối thiểu 56 px, chữ 20 px. Xác nhận/hủy dùng SPEC-046, khóa nút
trong lúc gửi và đọc lại người/giờ máy chủ; thẻ đã xác nhận đổi nền token
`accent-soft`. Không thêm đánh giá sức khỏe hoặc cảnh báo tuân thủ.

Có trạng thái tải, lỗi và thử lại; rỗng có lối Xem thuốc đang dùng. Hồ sơ
chưa đồng thuận/đã rút không đọc hoặc hiện liều, có hướng dẫn về luồng
đồng thuận hiện có. Hai entry Knip tạm của today tại T1 đã được bỏ.

```bash
yarn workspace @angia/web build
yarn exec playwright test --config playwright.today.config.ts
yarn verify:fast
```

Kiểm chứng local trên bản sao sạch `/tmp`: 5 test trình bày mới PASS;
toàn bộ unit 588 tệp / 2.906 test PASS; E2E route sản phẩm với API giả
16/16 PASS trên Chromium/WebKit ở 360 px (hai nền, kích thước nút,
xác nhận/hủy, tải, khóa gửi, lỗi thử lại, chuyển hồ sơ và withdrawn).
Không đổi API/domain/DB/dependency. Thanh điều hướng v1.0 thuộc E30-S1-T1;
axe/Lighthouse CI thuộc E25-S4-T1. Chưa nghiệm thu đăng nhập thật hoặc
SIT/Production; không coi E2E API giả là nghiệm thu toàn bộ TC-852/853.

`yarn verify:fast` PASS (typecheck + 11 test liên quan / 2 tệp); lint,
format phần thay đổi, kiểm trùng và Knip PASS trên bản sao sạch. Knip còn
hai gợi ý identity spike có sẵn. Build web PASS, còn cảnh báo chunk lớn.
Budget hai route self hiện khoảng 202,2–202,3 KB / 200 KB (checkpoint trước
200,9 KB); route Hôm nay khoảng 175,1 KB. Budget vẫn là việc mở trước PR;
chưa chạy full `yarn verify`. Tiếp theo E25-S4-T1; chưa đóng Epic 25.

### Accessibility CI — E25-S4-T1 (local 2026-11-11)

CI thêm job `accessibility` vào cổng `verify`: bản build web thật, API giả,
không đăng nhập/gọi SIT. Axe quét toàn trang Hôm nay ở 360 px trên
Chromium/WebKit, main/member và nền sáng/tối, trước/sau xác nhận liều;
chặn mọi vi phạm `serious`/`critical` thuộc WCAG A/AA đến 2.2. Kiểm riêng
chữ nội dung ≥16 px, nút chính ≥18 px/cao ≥56 px, vùng chạm ≥48 × 48 px
và không tràn ngang. Không dùng điểm Lighthouse để thay thế các kiểm tra này.

Lighthouse CI đo Accessibility trên `/` với hai URL query phân biệt nền;
server preview riêng chỉ bind loopback, phục vụ dữ liệu giả từ `todayState`,
chặn API lạ và xác nhận tiêu đề/hai thẻ liều/nền trước khi báo sẵn sàng.
Cấu hình dùng Chromium của Playwright, chặn lỗi `color-contrast`; báo cáo
chỉ lưu filesystem và artifact GitHub Actions 7 ngày.

```bash
yarn install --immutable
yarn build:contracts
yarn playwright install chromium webkit
yarn test:e2e:a11y
yarn test:lighthouse
yarn verify:fast
```

Báo cáo axe nằm ở `.playwright/a11y/` (macOS: thư mục tạm
`angia-a11y-playwright`); báo cáo Lighthouse ở `.playwright/lighthouse/`
và dữ liệu thu thập ở `.lighthouseci/`. Các thư mục này không commit.
Job GitHub-hosted runner cài browser cùng thư viện hệ thống qua `--with-deps`.

Kiểm tra toàn trang phát hiện layout chung còn vùng chạm 36/44 px và chữ
11–14 px. Theo owner duyệt bổ sung, đã chỉnh kích thước mobile trong
`MobileTopbar`, `AccountMenu`, `MobileBottomNav`, `ProfileFooter`; không đổi
điều hướng/nghiệp vụ. Không thêm dependency runtime; thêm devDependencies
`@axe-core/playwright`, `@lhci/cli` và peer `playwright-core` cùng bản Playwright.

Kiểm chứng bản sao sạch `/tmp`: axe 8/8 PASS, E2E Hôm nay cũ 16/16 PASS;
Lighthouse Accessibility 100/100 và tương phản PASS ở cả hai nền.
Đã thử chèn nút không tên và lỗi tương phản trong bản sao: axe/Lighthouse
đều báo đỏ đúng lỗi, sau đó bỏ phần chèn và chạy lại PASS.
`verify:fast` PASS (typecheck + 2.906 test / 588 tệp); lint, format,
kiểm trùng và Knip PASS (còn hai gợi ý identity spike có sẵn).
Tại ổ nguồn, lệnh `verify:fast` mặc định chạy đủ 2.906 test PASS nhưng
vẫn báo lỗi parse hai metadata AppleDouble có sẵn
`._Field.test.tsx` / `._TodayPresentation.test.tsx`; không xóa metadata hay
đổi cấu hình test trong task này. Chạy lại tại ổ nguồn bằng
`yarn verify:fast --exclude '**/._*'` PASS: typecheck và 2.906 test / 588 tệp.
Build web PASS; budget hai route self vẫn khoảng 202,3 KB / 200 KB,
là việc đang mở trước merge. Full `yarn verify` đã chạy trên bản sao sạch:
OpenAPI/typecheck/lint/format/unit/kiểm trùng/Knip/build PASS, dừng tại
`perf:budget`; `model:check` chưa chạy trong chuỗi do bước budget thất bại.
Chưa chạy GitHub CI, chưa nghiệm thu SIT/Production hay điện thoại thật; TC-876 mọi route
và NFR-9 toàn app vẫn mở. Chưa đóng Epic 25.

### Sửa budget hai route self — 2026-11-11

Owner duyệt chuyển `LabSeriesList` trong `SelfSection` từ import tĩnh sang
`lazy/Suspense`, theo mẫu tab Đau nhức/Nhiệt độ hiện có. Gói trang đầu không
còn tải giao diện, danh mục và phần phân nhóm xét nghiệm trước khi mở mục
xét nghiệm. Giữ nguyên API/cache/đồng thuận, quyền đọc và `readOnly`; khi
nạp chunk có trạng thái “Đang tải kết quả xét nghiệm…”. Không đổi dependency,
trần 200 KB hoặc thuật toán đo bundle.

TC-861 E2E mới tái hiện việc tải sớm trên bản cũ; sau sửa chỉ tải chunk khi
mở mục xét nghiệm, vẫn không có hành động ghi. Kiểm chứng trên snapshot
commit PR #75 cộng đúng diff đã duyệt: build/typecheck/lint, 13 unit liên
quan và 18 E2E tự xem hồ sơ/đau nhức/xét nghiệm Chromium/WebKit PASS.
Full `yarn verify` PASS: OpenAPI/typecheck/lint/format, 2.906 unit/588 tệp,
kiểm trùng/Knip/build/budget/model:check. Hai gợi ý Knip identity spike và
cảnh báo chunk lớn có sẵn vẫn giữ riêng.

Budget mới: `/my-profile` 198,6 KB; `/my-profile/pain/$issueId` 198,7 KB gzip,
mọi trang đầu ≤200 KB; TC-729 không có Three.js/GLB trong gói ban đầu PASS.
Kết quả này thay trạng thái budget đỏ ở checkpoint E25-S4-T1 phía trên.
Dư địa chỉ khoảng 1,3 KB; vẫn cần cổng CI cho thay đổi sau. Chưa nghiệm thu
SIT/Production, thiết bị thật, SPEC-081 hoặc TC-876 mọi route; chưa đóng Epic 25.

### E26-S1-T1 — nền schema xác thực local — 2026-11-12

Đã thêm migration `0040_local_identity_foundation` và schema cho
`account_credentials`, thông tin account local, nguồn phiên/Push,
`legal_document_versions`, `legal_acceptances`, `system_settings` và
`rate_limit_buckets`. Giữ UUID, subject OIDC, gia đình và liên kết hồ sơ cũ;
username cũ để NULL chờ mapping owner duyệt, không tự sinh credential.

Owner đã duyệt `accounts.legal_ref` ngẫu nhiên, duy nhất; bản đồng ý lưu mã
này từ đầu và không FK về account. Xoá account không sửa/xoá lịch sử đồng ý.
Role app chỉ được INSERT/SELECT `legal_acceptances`; runtime vẫn NOBYPASSRLS.
Phiên/Push cũ mang nguồn `oidc`, `oidc_auth_time` giữ NULL; luồng local sau
này phải ghi nguồn rõ ràng. Chưa thay hành vi login, admin guard hoặc worker.

Kiểm chứng trên source đã áp dụng: `yarn verify:fast` PASS (typecheck toàn
workspace; `--changed` không chọn unit), 13/13 integration trong 3 tệp PASS,
ESLint/Prettier phần thay đổi và `git diff --check` PASS. Test nâng cấp từ
0039 có dữ liệu kiểm việc giữ account/gia đình/hồ sơ/phiên/Push, quyền app,
bản đồng ý sau xoá account và chạy migration lặp lại.

**Chưa chạy migration lên DB ứng dụng local/SIT; T1 chưa PASS theo DoD,
E26 giữ 0/13 task đóng.** Chưa full `yarn verify`, push/PR/deploy hoặc cutover.
Chỉ role owner chạy migration; chạy lại phải báo `No pending migrations`.
Không cấp lại quyền UPDATE/DELETE/TRUNCATE cho `legal_acceptances` sau migrate.
Chi tiết đặc tả và hồ sơ nghiệm thu lưu riêng trong bộ `Docs/angia`:
`11-master-plan.md` và `acceptance/v1.0/epic26-acceptance.md`.

### E26-S1-T2 — ràng buộc và quyền xác thực local — 2026-11-12

Đã bổ sung 33 integration test trong `localIdentityConstraints.int.test.ts`
và `identitySourcesConstraints.int.test.ts`, chạy bằng role app trên PostgreSQL
Testcontainers. Kiểm unique/FK, định dạng PHC và version credential, cascade,
username/legal_ref; lỗi tại credential/legal/membership rollback account,
credential và bản đồng ý. Role app không superuser/BYPASSRLS hay sở hữu bảng legal;
INSERT/SELECT thực tế thành công, UPDATE/DELETE/TRUNCATE bị từ chối và bản đồng ý
đã commit giữ nguyên. Xoá account không làm mất lịch sử đồng ý.

Phiên/Push nhận `local` hoặc `oidc`, từ chối nguồn khác/NULL; cùng account giữ
được hai nguồn và Push giữ nguồn sau khi FK phiên chuyển NULL. Không đổi schema,
migration, dependency hoặc hành vi runtime.

Kiểm chứng local: 38/38 integration trong hai tệp mới và test migration T1 PASS;
ESLint/Prettier hai tệp và `yarn verify:fast` PASS (typecheck toàn workspace;
`--changed` không chọn unit test). `git diff --check` PASS.

Đây là bằng chứng nền DB của TC-896, chưa nghiệm thu transaction đăng ký qua
application hoặc hành vi worker TC-898/899. Chưa full `yarn verify`, SIT,
push/PR/deploy hoặc cutover; chưa đóng T2 theo DoD, E26 giữ 0/13 task đóng.

### E26-S2-T1 — port, fake và adapter xác thực local — 2026-11-12

Đã thêm port Application cho IdentityProvider/PasswordHasher/CredentialRepository,
fake phục vụ unit test, repository Drizzle nhận DB hoặc transaction ngoài và
adapter Argon2id async. Pin `argon2@0.45.2`; cấu hình ADR: 65536 KiB, timeCost 3,
parallelism 1, salt ngẫu nhiên 16 byte, hash 32 byte. Credential bắt đầu version 1;
thay hash tăng version nguyên tử với điều kiện version cũ còn khớp. Không ghi đè
credential khi insert trùng. Username không tồn tại vẫn verify dummy hash tạo
một lần cùng chính sách; sai mật khẩu/username trả cùng null cho tầng login.
Lỗi DB/hash truyền lên caller; snapshot trả về chỉ có trường xác thực, không hash.

Kiểm chứng: 12 unit mới và 7 integration repository PASS; cả nhóm identity/fake
37/37 unit PASS. Repository được kiểm bằng role app trên PostgreSQL Testcontainers,
gồm cập nhật đồng thời và rollback account/credential trong transaction ngoài.
`yarn verify:fast` exit 0: typecheck toàn workspace và 2921/2921 unit PASS.
ESLint/Prettier phần thay đổi, `git diff --check` và audit dependency production
PASS (audit không báo advisory). Build stage API theo Dockerfile hiện có và
smoke adapter đã biên dịch PASS trên Node 22.23.4 Linux arm64.

Volume gốc tạo AppleDouble `._*` khiến native loader/Vitest/Docker đọc nhầm
metadata; kiểm chứng unit/verify:fast/build dùng bản sao sạch trong
`/private/tmp/angia-e26-s2-t1/source`, đã đối chiếu SHA-256 source/dependency.
Không sửa cấu hình dự án để né lỗi môi trường. Log và manifest nằm trong
`/private/tmp/angia-e26-s2-t1/` (tạm thời).

Chưa nối adapter vào runtime. Benchmark SIT 50 vòng, giới hạn đồng thời/hàng đợi
và kiểm image runtime còn thuộc E26-S2-T3; thu hồi phiên/worker thuộc S2-T2,
transaction đăng ký đầy đủ thuộc S3-T1, login/recheck version thuộc S4-T1.
Không coi test snapshot thay bằng chứng DTO/log/export của luồng local hoàn chỉnh
hoặc TC-895/896/907 đầu-cuối. Chưa full `yarn verify`, SIT, push/PR/deploy
hoặc cutover; E26 giữ 0/13 task đóng, chờ nghiệm thu theo DoD.

### E26-S2-T3 — giới hạn hash và benchmark local/Linux — 2026-11-12

Owner duyệt áp dụng phạm vi adapter/repository và build runtime; giữ nghiệm thu
lifecycle TC-906 mở đến khi các luồng phụ thuộc hoàn thành. Hash/verify/dummy hash
chia sẻ giới hạn 1 tác vụ đang chạy + 2 chờ FIFO trên mọi instance trong cùng
tiến trình; đầy trả ERR_PASSWORD_HASH_BUSY, lỗi vẫn trả slot. Không thay cấu hình
Argon2id, dependency, schema, port hoặc Dockerfile. Repository chỉ đổi hai import
sang tương đối để runner dùng mã thật từ scripts. Thêm lệnh
`yarn identity:local:measure --origin=...`; hướng dẫn ở scripts/spike/README.md.

50/50 vòng adapter/repository local PASS và dọn sạch account/credential tổng hợp:
Mac Node 24.15.0 median verifyPassword 99,10 ms; image runtime Node 22.23.4 Linux
arm64, user 10001, giới hạn 1 CPU/256 MiB/no swap median 117,25 ms, peak RSS
134,39 MiB. Giữ mẫu đầu; đo lookup repository + verify, chưa gồm HTTP/session.
Bão hoà thực nhận đúng 3 verify và từ chối tác vụ thứ tư. Linux runtime build và
smoke đúng/sai mật khẩu PASS theo Dockerfile hiện có. Ngân sách 1+2 là ứng viên,
chưa coi số đo local Docker là benchmark backend SIT.

8 unit mới; nhóm identity/benchmark 43/43 PASS, hồi quy repository 7/7 integration
PASS. `yarn verify:fast` exit 0 trên bản sao sạch: typecheck toàn workspace và
2929/2929 unit PASS. 10/10 tệp source/test/config áp dụng khớp SHA-256 bản kiểm.
ESLint/Prettier phần thay đổi và git diff --check PASS. Volume gốc vẫn lỗi
AppleDouble/native loader; lượt unit đồng thời có timeout, đã chạy lại tuần tự
PASS, không nới timeout/config. Knip production chưa PASS: VerifiedIdentity và
CredentialIdentity từ S2-T1 chỉ có consumer ngoài tệp trong test; không sửa port
ngoài phạm vi. Log/manifest tạm: /private/tmp/angia-e26-s2-t3/.
Báo cáo và bằng chứng đã lưu trong bộ Docs riêng tại
`Docs/angia/acceptance/v1.0/evidence/e26-s2-t3-2026-11-12/`.

Chưa nối adapter vào API runtime, chưa đo backend SIT hoặc HTTP đầu-cuối,
429/503/không session, khoá/mở khoá/thu hồi phiên, backup/restore/cutover TC-908.
Chưa full yarn verify, push/PR/deploy; chưa đóng T3/TC-905/906/908 theo DoD,
E26 giữ 0/13 task đóng. Thay đổi README E25 có sẵn được giữ nguyên.

## E26-S2-T2 — lifecycle local và phân nguồn (2026-11-12)

**Checkpoint E26-S2-T2 — 2026-11-12:** owner duyệt và áp dụng 21 tệp source/test. Port/fake/lifecycle local nhận transaction ngoài; khoá/revokeAll thu hồi phiên/Push cả hai nguồn và tăng credential_version, mở khoá không hồi sinh, primitive xoá rollback cùng transaction. Caller vẫn chịu kiểm quyền/điều kiện xoá/audit. Repository phiên đọc authMethod từ DB, từ chối account khoá và giữ khoá account trước cấp phiên OIDC; admin cần phiên OIDC + cờ quyền. Uỷ quyền/cập nhật Push chép nguồn từ phiên thật. Worker chỉ xét account liên kết OIDC, đếm/thu hồi phiên/Push OIDC kể cả last_session_id NULL, giữ local và các lan can snapshot/trần/lỗi IdP. Hồi quy 60/60 integration trong 11 tệp PASS; bản cuối lifecycle 9/9 và worker 6/6 PASS (các lượt có trùng test). Toàn bộ unit 2930/2930 PASS. ESLint/Prettier source và git diff --check PASS; 21/21 tệp áp dụng khớp SHA-256 bản sao sạch. verify:fast tại volume gốc typecheck PASS nhưng Vitest lỗi parse AppleDouble scripts/spike/._runLocalIdentityBenchmark.test.ts; bản sao sạch verify:fast PASS (typecheck toàn workspace + unit liên quan). Không nới config/xoá metadata. BR-045/Tech Spec đã làm rõ nguồn phiên và vô hiệu snapshot sau thu hồi. Chưa nối lifecycle vào route khoá/xoá/audit v1.0; login local/hash/version đầu-cuối TC-904 còn S4-T1. Chưa full yarn verify, SIT, push/PR/deploy hoặc cutover; **chưa đóng T2 theo DoD, E26 giữ 0/13 task đóng**.

## E26-S3-T1 — đăng ký local trong một transaction (2026-11-13)

**Checkpoint E26-S3-T1 — 2026-11-13:** owner chốt thiết kế: port + adapter tối thiểu, phiên tạo sau commit, có tầng infrastructure. Feature `apps/api/src/features/account` thêm domain `validateRegistrationInput` (username chuẩn hoá chữ thường `^[a-z0-9._-]{3,32}$`, mật khẩu ≥ 8 và khác username, displayName 1–60, email tuỳ chọn, `ageConfirmed` bắt buộc), use case `registerLocalAccount` (validate → công tắc/lời mời → phiên bản legal hiện hành → username trùng → hash ngoài transaction → transaction account + credential + 2 legal_acceptances + membership → commit → phiên `authMethod: 'local'`). Adapter: công tắc đọc `system_settings.registration_open` (thiếu dòng = mở); legal lấy bản `published_at` mới nhất mỗi loại; lời mời là stub trả `null` tới E27-S3-T3. Race unique `accounts_username_normalized_unique` → `ERR_USERNAME_TAKEN`, lỗi khác rollback và ném tiếp; lỗi tạo phiên không rollback tài khoản. `NewSession` thêm `authMethod` tuỳ chọn. **20/20 unit + 11/11 integration PASS** (PostgreSQL Testcontainers role app: TC-736/737 kèm race/738/742/743/896 rollback legal và membership, đếm account/credential/legal trước–sau; công tắc/legal). ESLint/Prettier PASS; `yarn verify:fast` exit 0 sau khi xoá AppleDouble `._*`. TC-741 chỉ PASS mức unit với fake lời mời. Chưa route/OpenAPI (S3-T2), rate limit (S3-T3), full `yarn verify`/knip, SIT, push/PR/deploy; **chưa đóng T1 theo DoD, E26 giữ 0/13 task đóng**.

## E27-S1-T2 — Kiểm kê quyền RLS (2026-11-17)

Chạy từ gốc repository, cung cấp `DATABASE_OWNER_URL` của đúng môi trường qua
môi trường chạy hoặc `.env` hiện có:

```sh
yarn ops:rls-inventory
```

Lệnh không có tuỳ chọn chọn môi trường `--env`; URL kết nối quyết định DB đích.
Công cụ dùng transaction `REPEATABLE READ READ ONLY`, timeout mỗi statement 10 giây,
xuất JSON metadata role, membership, schema/ACL, bảng/view/sequence và RLS, quyền cột,
policy, hàm `SECURITY DEFINER`/`search_path`/ACL và default privileges.
Không đọc dữ liệu nghiệp vụ. Mã thoát 0 nghĩa là kiểm kê thành công; 1 là lỗi kiểm kê.
Báo cáo không tự kết luận quyền tối thiểu đạt; cần review ACL cùng owner và membership.

Kiểm tra riêng T2:

```sh
yarn vitest run --project unit scripts/ops/readRlsInventory.test.ts
DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock yarn vitest run --project int apps/api/test/isolation/outsideRls.int.test.ts
```

Đã kiểm chứng local: 3 unit PASS; 3 integration PASS, 3 TODO trên PostgreSQL 16
Testcontainers. Phép nới BYPASSRLS làm cùng assertion thất bại, khôi phục lại xanh;
chỉ tác động container dùng một lần. Typecheck và lint/format phần đổi PASS.
`verify:fast` chưa xanh do sandbox cấm mở socket và metadata macOS `._*` bị thu thập
thành test. Lượt unit bổ sung ngoài sandbox có 3.363 test PASS nhưng vẫn exit 1 vì
một suite metadata. Chưa coi các cổng verify toàn bộ là PASS.

Owner nghiệm thu T2 theo phạm vi duyệt, giữ thứ tự phát triển và chuyển TC-868–870
chưa thực thi thành nợ kỹ thuật: **E27-T2-D1** → E27-S3-T2/T3;
**E27-T2-D2** → E28-S2-T2; **E27-T2-D3** → E29-S3-T1/T2.
Mỗi task nhận nợ phải thay TODO bằng test trên đường thật, có ca hợp lệ và phép
nới quyền làm cùng assertion thất bại, khôi phục lại xanh trước nghiệm thu đường đó.
Xem [hồ sơ nghiệm thu E27](../../Docs/angia/acceptance/v1.0/epic27-acceptance.md)
và [sổ nợ trong master plan](../../Docs/angia/11-master-plan.md).
T1 vẫn chưa đóng toàn bộ DoD; tiếp theo E27-S2-T1. Chưa push/PR/deploy.

### E27-S2-T1 — Schema nhà tự phục vụ (2026-11-17)

Migration `apps/api/drizzle/0041_v1_household.sql` thêm Chủ hộ, thời điểm gỡ
thành viên gần nhất và sáu bảng: lời mời, đề nghị trao quyền, yêu cầu xoá nhà,
người giám hộ, cửa sổ người bị gỡ và nhật ký quản lý. Năm bảng theo nhà có RLS;
role app chỉ INSERT nhật ký, không SELECT/UPDATE/DELETE/TRUNCATE. ID trong nhật
ký là snapshot để còn sau khi xoá đối tượng. Chưa thêm ba đường ngoài RLS.

Chuyển tiếp được owner duyệt: `owner_account_id` tạm nullable, không tự chọn
Chủ hộ/người giám hộ cho dữ liệu cũ. Chủ hộ đã gán phải là `main` cùng nhà và
không được bỏ giá trị. Hồ sơ chưa backfill được phép chưa có người giám hộ;
khi đã có thì không được gỡ người cuối cùng của hồ sơ vị thành niên không liên
kết còn tồn tại. Backfill và siết đầy đủ tiếp tục ở E27-S6/các luồng E28.

Trigger kiểm cả thay đổi tài khoản, năm sinh và liên kết hồ sơ. Các cập nhật
`id = id` có chủ đích tạo phiên bản hàng mới để snapshot cũ lỗi serialization
thay vì phá bất biến; không đổi giá trị nghiệp vụ. Transaction cạnh tranh có
thể bị PostgreSQL từ chối và phải được xử lý tại luồng gọi tương ứng.

Kiểm chứng ba suite `householdConstraints`, `householdSnapshots`,
`householdPrivileges`: 16 PASS trên PostgreSQL 16 Testcontainers. Phép phá RLS
đã thay cổng “bảng chưa tồn tại” trong suite cô lập bằng fixture/probe thật cho
cả năm bảng mới. Hồi quy cuối DB, hồ sơ/liên kết, tài khoản và cô lập:
42 suite / 684 PASS, 20 TODO thuộc các đường chưa triển khai. Typecheck,
lint/format phần API thay đổi đạt; `verify:fast`
vẫn lỗi thu thập metadata macOS `._AccountPages.test.tsx` (ký tự NUL).
Lượt unit bổ sung dùng cấu hình tạm chỉ loại `._*`: 650 suite / 3.363 test PASS;
không đổi cấu hình kiểm tra dự án và không gọi đó là `verify:fast` PASS.

Chưa chạy migration trên DB ứng dụng local/SIT, chưa đóng DoD E27-S2-T1,
chưa push/PR/deploy. Chỉ role owner chạy `yarn db:migrate`; chạy lại phải
không còn migration chờ. Hồ sơ và các bước nghiệm thu còn lại nằm tại
[nghiệm thu E27](../../Docs/angia/acceptance/v1.0/epic27-acceptance.md).

### E27-S3-T1 — API tạo nhà (2026-11-17)

`POST /api/families` nhận `{ name, invitationToken? }`, trả `Family` (201).
Phiên, CSRF, đổi mật khẩu bắt buộc và đồng ý pháp lý dùng gate hiện có.
Transaction khóa tài khoản, kiểm lại membership/pháp lý, tạo nhà, gán `main`
và `owner_account_id`, ghi `family_created`. Nhà mới hưởng lượt mặc định CP5.5
mà không cần tạo dòng quota tháng. Hai request cùng tài khoản chỉ tạo một nhà.

Khi đóng đăng ký, cần lời mời `found_family` hợp lệ. Migration
`0042_founding_invitation_access.sql` thêm hai hàm đặc quyền nhận hash, chỉ trả
ID hoặc boolean; claim lời mời cùng transaction với tạo nhà, thêm một sự kiện
`invitation_accepted`. Runtime không có SELECT toàn bảng lời mời hoặc hai cột
hash; các cột quản lý còn lại vẫn qua RLS. Chỉ role owner chạy migration.
API phát hành/thu hồi, `join_family` và verifier đăng ký bằng lời mời tiếp tục
ở T2/T3; chưa nghiệm thu luồng tạo tài khoản bằng lời mời khi đóng đăng ký.

Source đã áp dụng theo review owner duyệt. Integration bổ sung: 6 suite,
352 PASS, 19 TODO; unit toàn workspace bổ sung: 652 suite, 3.370 PASS.
Hai lượt dùng cấu hình tạm ngoài dự án chỉ loại metadata macOS `._*`.
`yarn verify:fast` qua typecheck toàn workspace nhưng exit 1 do metadata
`._AccountPages.test.tsx` chứa NUL; không gọi lượt bổ sung là verify PASS.
Lint/format phần T1 và diff check đạt. Chưa full `yarn verify`, chưa migrate
DB ứng dụng local/SIT, push hoặc deploy; chưa đóng toàn bộ DoD.

## E27-S3-T2 — Lời mời vào nhà local (2026-11-17)

Đã có `POST /api/family/invitations` (`kind: join_family`, `role: main | member`)
và `DELETE /api/family/invitations/{id}`. Chủ hộ/Đồng quản lý tạo lời mời;
người tạo còn cùng nhà hoặc `main` cùng nhà thu hồi được. Token/mã chỉ lưu SHA-256,
hạn 7 ngày; audit và thay đổi lời mời cùng transaction. Link `/invite#token=…`;
web nhận link thuộc E27-S5-T2, xác nhận và verifier đăng ký thuộc E27-S3-T3.
TC-775–776 chuyển sang T3 theo owner duyệt, giữ nguyên tổng giờ.

Migration `0043_join_invitation_lookup.sql` thêm hàm tra băm token/mã
`lookup_join_invitation(text)`, chỉ trả dữ liệu tối thiểu; không mở quyền đọc hash.
Hàm chỉ tra cứu; T3 phải khoá và kiểm lại hạn/trạng thái khi claim lời mời.
Chạy migration bằng owner qua quy trình `yarn db:migrate` hiện hành khi triển khai;
runtime tiếp tục dùng role app `NOBYPASSRLS`.

Kiểm chứng Testcontainers: 5 suite / **364 PASS, 16 TODO**; migration/quyền app
thêm 2 suite / **9 PASS**. TC-868 cả `found_family`/`join_family` có ca hợp lệ và
phép nới SELECT làm cùng assertion thất bại rồi khôi phục xanh. Unit bổ sung:
653 suite / **3.376 PASS**, dùng cấu hình tạm chỉ loại metadata macOS `._*` ở từng
project. OpenAPI/kiểu client, typecheck, lint/format phần đổi và diff check đạt.
`yarn verify:fast` vẫn exit 1 do metadata chứa NUL sau khi typecheck hoàn tất;
không gọi lượt bổ sung là verify PASS. Source và tài liệu trong repository được
commit cùng task; mã commit và kết quả hook ghi trong hồ sơ E27 ngoài Git source.
Chưa full `yarn verify`, chưa migrate DB ứng dụng local/SIT, push/PR/deploy hoặc
đóng toàn bộ DoD. Chi tiết tại
[hồ sơ E27](../../Docs/angia/acceptance/v1.0/epic27-acceptance.md).

## E27-S3-T3 — Xác nhận lời mời và lời mời lập nhà (2026-11-17)

Đã có `POST /api/invitations/accept` (204, `{ token }`, token hoặc mã),
`POST /api/admin/founding-invitations` (201, `{ kind: "found_family" }`) và
`DELETE /api/admin/founding-invitations/{id}` (204, người tạo thu hồi).
Hai route quản trị chỉ cho SystemAdmin qua OIDC, kiểm lại quyền DB dưới khoá.
Mã hex 12 ký tự không phân biệt hoa thường; token base64url phân biệt hoa thường.

Xác nhận `join_family` dùng scope từ tra hash bí mật, khoá account → family →
invitation, kiểm lại hạn/trạng thái sau khi chờ khoá. Claim, membership và một
`invitation_accepted` cùng transaction; không tự liên kết hồ sơ. Nhà pending
xoá bị chặn. Hai người tranh một token chỉ một người thành công; một tài khoản
tranh hai lời mời chỉ vào một nhà.

Verifier đăng ký đã dùng DB thật. Transaction đăng ký kiểm lại công tắc/pháp lý/
lời mời; `join_family` được claim cùng account + credential + hai legal acceptances.
Lỗi rollback tất cả; phiên vẫn tạo sau commit theo thiết kế E26. `found_family`
cho phép đăng ký khi công tắc tắt nhưng chỉ được claim khi tạo nhà. Token được
cung cấp mà không còn hiệu lực khi ghi: `ERR_NOT_FOUND` khi đăng ký mở,
`ERR_REGISTRATION_CLOSED` khi đăng ký đóng; nhà pending xoá: `ERR_DELETION_PENDING`.

Migration `0044_founding_invitation_management.sql` bổ sung phát hành/thu hồi lập
nhà qua hàm SECURITY DEFINER, hỗ trợ mã ở đường lập nhà cũ; UUIDv7 do ứng dụng
sinh, DB tính hạn 7 ngày. Không đổi cấu trúc bảng; không mở SELECT hash, không
EXECUTE cho PUBLIC; runtime giữ NOBYPASSRLS. Triển khai theo quy trình migration
owner hiện hành; **chưa chạy trên DB ứng dụng local/SIT**.

Kiểm chứng: TC-775–781 PASS trên Testcontainers. Hồi quy nhà/cô lập: 11 suite /
401 PASS, 14 TODO thuộc task sau. Hồi quy account/pháp lý: 12 suite / 97 PASS.
Migration/quyền/snapshot và đăng ký (gồm rollback pháp lý bổ sung): 4 suite /
20 PASS. Các nhóm có test trùng, không cộng tổng. Unit bổ sung toàn workspace:
656 suite / 3.389 PASS. Dùng cấu hình tạm ngoài repository chỉ loại metadata
macOS ở từng project; test socket/Testcontainers chạy ngoài sandbox.
OpenAPI/client, typecheck toàn workspace, lint/format phần đổi và diff check đạt.
`yarn verify:fast` exit 1 do Vitest đọc metadata `._*` chứa NUL sau khi typecheck
PASS. Chưa full verify, commit/push/PR/deploy hoặc đóng toàn bộ DoD.
Bằng chứng tại [hồ sơ E27](../../Docs/angia/acceptance/v1.0/epic27-acceptance.md).

Tài liệu thực thi T3: [runbook migration và kiểm chứng](../../Docs/angia/10-setup-and-ops-guide.md#e27-s3-t3--lời-mời-và-migration-0044-2026-11-17),
[bảng TC/suite](../../Docs/angia/08-test-cases-specification.md#137-spec-065--lời-mời-vào-nhà-và-lời-mời-lập-nhà)
và [runbook isolation](apps/api/test/isolation/README.md#e27-s3-t3--probe-xác-nhận-và-lập-nhà-2026-11-17).
Các checkpoint T1/T2 và ghi chú stub tại E26 ở trên là lịch sử; verifier thật
và trạng thái source hiện hành theo checkpoint T3. Bước phát triển kế tiếp là
E27-S4-T1; các cổng nghiệm thu còn thiếu vẫn giữ nguyên.

## E27-S4-T1 — Bộ ghi nhật ký quản lý (2026-11-17)

Đã áp dụng theo phạm vi owner duyệt: `apps/api/src/shared/audit/writeAdminAuditEvent.ts`
nhận transaction hiện tại, chỉ nhận bốn action đã triển khai (`family_created`,
`invitation_created`, `invitation_revoked`, `invitation_accepted`), từ chối action
khác ở runtime và luôn tự tạo `metadata: {}`. Không chuyển tiếp metadata/ID
sự kiện từ DTO; thời điểm do DB cấp. Không bắt lỗi ghi hoặc mở transaction riêng.
Năm tệp infrastructure nhà dùng chung bộ ghi; đăng ký kèm join tiếp tục dùng
luồng xác nhận hiện có nên không thêm sự kiện trùng. Không đổi schema hoặc API.

Tạo nhà bằng lời mời lập nhà giữ hai sự kiện: một `family_created` và một
`invitation_accepted`; mỗi thao tác nghiệp vụ đúng một sự kiện tương ứng.
Bộ test mới kiểm tra bảy luồng, actor/đối tượng/thời điểm/metadata, đúng số
sự kiện và rollback ở commit bằng deferred trigger; so sánh toàn bộ snapshot
accounts/families/invitations/audit trước và sau lỗi. Test bảo vệ metadata còn
truyền thử mật khẩu/token/tên thuốc/số đo và xác nhận không lưu các trường đó.

Phần TC-839/840 chưa triển khai tiếp tục là điều kiện nghiệm thu tại task nhận:

| Thao tác                          | Task nhận    |
| --------------------------------- | ------------ |
| Rời nhà                           | E28-S1-T2    |
| Yêu cầu/thu hồi/thực hiện xoá nhà | E28-S2-T2    |
| Người giám hộ                     | E28-S2-T3    |
| Đặt lại mật khẩu                  | E29-S1-T1/T2 |
| Đổi công tắc đăng ký              | E31-S1-T1    |
| Khoá/mở khoá tài khoản            | E31-S1-T2    |

Mỗi task nhận bổ sung action khi triển khai, ghi trong transaction nghiệp vụ
và kiểm tra đúng một sự kiện/rollback trước nghiệm thu. Worker triển khai
adapter trong app worker theo cùng hợp đồng; không import source app API.
TC-841/842 và quét toàn bộ v1.0 TC-880 vẫn theo E31/các cổng nghiệm thu tương ứng;
không lấy test metadata cục bộ thay cho quét toàn bộ.

Kiểm chứng: integration nhà/audit/đăng ký **10 suite / 92 PASS**, gồm **17 test mới**;
unit household/account và kiểm tra phân tầng **16 suite / 170 PASS**. Typecheck
workspace, ESLint/Prettier phần source đổi và `git diff --check` đạt.
`yarn verify:fast` exit 1 sau typecheck PASS vì Vitest đọc metadata macOS `._*`
chứa NUL. Lượt kiểm chứng bổ sung dùng cấu hình tạm ngoài repository chỉ loại
metadata ở từng project; Testcontainers chạy ngoài sandbox qua Colima.
Không sửa cấu hình test nguồn hoặc xoá metadata. Không gọi lượt bổ sung là
`verify:fast` PASS. Chưa full verify, commit/push/PR/deploy; không đóng toàn bộ
TC-839 hoặc tăng tổng task nghiệm thu. Giữ nguyên thay đổi Legal Update có trước.

Tài liệu liên quan: [đối chiếu TC-839/840](../../Docs/angia/08-test-cases-specification.md#1318-spec-076--nhật-ký-quản-lý),
[runbook S4](../../Docs/angia/10-setup-and-ops-guide.md#e27-s4-t1--ghi-nhật-ký-quản-lý-2026-11-17),
[bàn giao S4](../../Docs/angia/12-onboarding-guide.md#e27-s4-t1--bàn-giao-bộ-ghi-audit-2026-11-17)
và [báo cáo bằng chứng](../../Docs/angia/acceptance/v1.0/evidence/e27-s4-t1-2026-11-17/report.md).
Bước phát triển kế tiếp là **E27-S5-T1**, phụ thuộc bản Stitch; các cổng nghiệm
thu còn mở của E27 giữ nguyên. Ghi chú chưa commit ở trên mô tả checkpoint
trước commit; mã commit source và kết quả hook được ghi tại hồ sơ E27.

## E27-S5-T1 — Bắt đầu và tạo nhà

**UI được owner duyệt ngày 2026-11-18** với xác nhận “UI đã đạt”.
Chuỗi nhận diện trên web/mobile là **Sổ tay chăm sóc gia đình**.

Tài khoản chưa có nhà vào `/waiting` (Bắt đầu); `/waiting?step=create` là form
Tạo nhà mới. Tên mặc định trống, trim và kiểm tra 1–60 ký tự; gửi
`POST /api/families` kèm CSRF. API thành công hoặc báo đã thuộc nhà thì tải lại
phiên rồi điều hướng vào ứng dụng. Nếu tải phiên lỗi sau khi tạo, thử lại chỉ
GET phiên, không POST tạo nhà lần nữa. Lỗi giữ tên, không lộ message nội bộ.
Thẻ Tôi có mã mời hiện chưa khả dụng; luồng mã/link và chuyển tiếp token lập nhà
thuộc E27-S5-T2. Backend dùng mã 12 ký tự.

Giữ header/footer chung; chưa có nhà ẩn search và điều hướng chính, `/admin`
ẩn ba tab và điều hướng đáy. Người đã có nhà giữ điều hướng theo quyền hiện tại.
Menu gộp Hồ sơ cá nhân/Hồ sơ của tôi thành một lối vào `/my-profile` khi đã liên
kết, bỏ Cài đặt gia đình. Trạng thái chưa có nhà lấy từ phiên, không suy ra vai
trò hoặc dùng email mẫu.

Hai trang giữ layout, typography, radius, shadow và glow theo Stitch owner chọn.
Bắt đầu desktop dùng khung 580px/bo 28px; mobile không có thẻ trắng bao ngoài.
Form desktop 560px, padding 32px, bo 16px; mobile có gợi ý tên và nút xóa ô nhập.
Menu desktop dropdown 280px; mobile bottom sheet tối đa 420px, bo 28px, scrim
40%/blur 3px, trượt 300ms. Native dialog giữ focus, Escape/bấm ngoài/nút đóng
đều đóng được và trả focus; reduced motion tắt transition. Bộ chọn nền bằng
icon cập nhật theme và localStorage thật. Hàng Cần hỗ trợ thiết lập?/Chính sách
quyền riêng tư dưới Bắt đầu đã bỏ trên cả hai breakpoint theo owner 2026-11-18.

Màu sáng khôi phục: nền `#F0FCFB`, xanh `#004135`, hover `#20594B`, nền nhấn
`#EAF6F5`, chữ `#131D1D`/`#404945`, viền `#BFC9C4`, focus `#286958`.
Không đổi màu dữ liệu sức khỏe hoặc bản in. Các khối dùng dữ liệu/câu mô tả đúng
nghiệp vụ, không nhập tuyên bố chuẩn y khoa/HL7, lịch tiêm, hứa đổi tên, phiên bản
mẫu hoặc script thành công giả trong HTML tham chiếu. Các ngoại lệ thị giác chỉ
áp dụng vào hai trang/menu đã được owner chỉ định.

Tham chiếu Stitch project `12209147960511107004`: Bắt đầu mobile
`1e48d365401b4fa18a916ce014ca7bb7`, desktop `154a6f5498bc4ba8b32546bbfed77ea7`;
Tạo nhà mobile `1a50e856b8fc48e4a9d3ae25b1b6276f`, desktop
`482d847868674af790fb11815cb19fba`; menu desktop
`04d3d0020b954ccea0fb4f250427e18f`, mobile `a3cd15e51d024bad8c2c5bb0e1e05a34`.
Minh họa và icon/font tự lưu trữ; không tải CDN lúc mở trang.

Kiểm chứng local: 15 suite / 92 unit và phân tầng PASS; 72 E2E PASS trên
Chromium mobile/desktop và WebKit, hai nền, 360px/chữ 200% và animation thật.
Hồi quy đăng nhập/enrollment trước đó 24 PASS. Typecheck, build, lint/format
phần đổi đạt. Chạy E2E sau build bằng:

```bash
yarn exec playwright test --config playwright.account.config.ts householdStart.spec.ts
```

`yarn verify:fast` exit 1 sau typecheck PASS vì Vitest đọc metadata macOS `._*`;
lượt unit bổ sung loại metadata bằng CLI không thay cổng chính thức.
Đây là duyệt UI của owner, chưa phải nghiệm thu SIT hoặc đóng toàn bộ E27.
Chưa full verify, smoke API/DB thật trong task web hoặc deploy. Bước tiếp theo
là **E27-S5-T2**; các cổng migration, verify và SIT của E27 tiếp tục giữ mở.
Tài liệu chi tiết tại [hồ sơ E27](../../Docs/angia/acceptance/v1.0/epic27-acceptance.md).

## E27-S5-T2 — Lời mời vào nhà và giao diện dùng chung (2026-11-18, local)

Owner đã duyệt triển khai và xác nhận giao diện hiện tại đạt trong chat.

- **Gửi lời mời:** Tài khoản → Mời người thân (`/family/invite`). Chọn Thành viên
  hoặc Đồng quản lý rồi bấm Tạo lời mời. Mỗi vai trò có mã/link riêng; chuyển vai
  trò chỉ đổi mã đang xem. Ra/vào và reload lấy lại mã từ server, giữ nguyên hạn.
  GET `/api/family/invitations/current` trả tối đa hai lời mời của chính người tạo.
- **Chia sẻ:** copy/share có kết quả thật và một toast cố định, không đẩy bố cục
  khi bấm lặp; có sao chép thủ công nếu clipboard không dùng được. Mã hết hạn
  mờ/gạch ngang, khóa share/copy và có Tạo lời mời mới. Thu hồi có xác nhận.
  Lịch sử và nút thu hồi-kèm-tạo mới không hiện trên UI; lịch sử chờ quyết định sau.
- **Nhận mã:** “Tôi có mã mời” mở `/waiting?step=join`; chuẩn hóa mã hex 12 ký tự,
  POST nhận lời mời với CSRF, sau 204 tải lại phiên. GET phiên lỗi thì chỉ tải
  lại GET, không nhận mã lần hai. Không tự liên kết tài khoản với hồ sơ.
- **Tạo nhà:** form gọn trong một block, giữ kiểm tra tên và phục hồi phiên hiện có.
- **Khung dùng chung:** header có back/title không logo; member chưa liên kết
  không có search/tab desktop hoặc bottom nav mobile. Member đã liên kết giữ
  điều hướng cá nhân, main giữ giao diện quản lý. Footer hai nhóm trên desktop,
  xếp hàng trên mobile, dùng shadow thay border. Button dùng cursor pointer;
  indicator vai trò trượt 200ms, hỗ trợ reduced-motion. Menu tải khi mở để giữ budget.

Lời mời mới lưu hash cùng AES-GCM ciphertext. API cần khóa độc lập
`INVITATION_ENCRYPTION_KEY` tối thiểu 32 ký tự, giữ ổn định và sao lưu riêng
ngoài DB/repo. Mất/đổi khóa khi chưa tái mã hóa sẽ không đọc lại được mã cũ.
Không lưu mã/link/token vào browser storage; chỉ lưu lựa chọn vai trò theo
account/family. Legacy hash-only không khôi phục mã được, vẫn thu hồi được.

Dev `localhost:5433/angia_dev` đã backup trước migration 0041–0045; journal 46,
chạy lại no pending. Runtime vẫn `angia_dev_app` NOBYPASSRLS; RLS và quyền đọc
hash/audit đã kiểm tra. Không chạy smoke ghi dữ liệu trên tài khoản dev; API
integration dùng PostgreSQL Testcontainers tạm. Không thay SIT/Production.

Tham chiếu Stitch project `12209147960511107004`: gửi desktop
`e8d584145aa44f24836a56f0e8a02019`, mobile `3cc7b3c52c9346c6902ed33b867c26d4`;
hết hạn desktop `cb6582ee6870458ea9b74aa5acbc822c`, mobile
`0b4fd0a920c84f0ab3813be4cc128ac2`; thu hồi desktop
`30aa5e305ea74da7b61bdd4a52f1659f`, mobile `4babd60ba7594db2ae02d2bb47d03237`;
Tạo nhà desktop `fafff946ed7b4a74b5a5844ebb8ddb81`, mobile
`cfd254f045364a9193ea1f696cbd8df1`. Giữ mô tả quyền đúng sản phẩm.

**Cập nhật giao diện owner duyệt ngày 2026-11-19:** arrow 3D chỉ giữ ở hai lựa
chọn trên màn Bắt đầu; các màn khác dùng lại mũi tên cũ. Tạo nhà mới dùng icon
từ màn desktop nêu trên, giữ form và hành vi hiện có. Avatar tài khoản dùng
chung trên desktop/mobile. Màn mời dùng tab và khối mã theo từng breakpoint,
với bộ icon desktop dùng chung cho mobile; modal/bottom sheet thu hồi dùng bộ
icon của màn xác nhận desktop. Mười lăm SVG lưu local tại
`apps/web/public/images/household/stitch/`, hiển thị qua `ClayIcon`; không đổi
API, quyền hoặc vòng đời lời mời. Build/typecheck, lint/format phần đổi,
**228/228 E2E** và **16/16 kiểm tra giao diện** tại 360/390/768/1440 px ở hai
nền PASS. **50 unit test liên quan** PASS trên bản sao sạch metadata;
`yarn verify:fast` trên bản sao đó PASS (52 test liên quan). Lệnh trên volume
gốc vẫn vướng metadata macOS `._*`; chưa ghi full `yarn verify` PASS cho đợt này.

API household/audit: 91 integration PostgreSQL tạm PASS ở checkpoint triển khai.
Build/typecheck, lint/format phần đổi và budget mọi route PASS, lớn nhất
199,2 KB/200 KB. Official `verify:fast` còn metadata macOS `._*` sau typecheck;
knip còn LegalDocumentLink/HouseholdRequest ngoài phạm vi. Không ghi full verify PASS.

Kiểm tra trước commit: **228/228 E2E** (Chromium touch/desktop và WebKit, hai nền)
và **79 unit/phân tầng liên quan** PASS. `verify:fast` còn lỗi metadata như trên.

**Chưa đóng toàn bộ E27-S5-T2:** nhận link `/invite#token`, chuyển tiếp qua đăng
nhập/đăng ký và token lập nhà trên web còn chờ. Xác nhận UI của owner không thay
nghiệm thu SIT hoặc các cổng API/ACL của E27. Bộ Docs/angia cập nhật riêng ngoài
Git source; thay đổi Legal Update và chỉnh spacing có trước giữ ngoài commit này.

## E27-S6-T1 — Chuyển đổi Chủ hộ của nhà hiện có

Lệnh vận hành SPEC-071 dùng `DATABASE_OWNER_URL`, không dùng role runtime.
Không đổi schema. Chuẩn bị hai tệp JSON riêng tư do owner xác nhận:

- `family-owners.json`: `{ "<familyId>": "<ownerAccountId>" }`, khớp mọi nhà trong DB;
  mỗi Chủ hộ phải là `main` cùng nhà.
- `profile-creators.json`: `{ "<profileId>": "<creatorAccountId>" }`, khớp mọi hồ sơ
  dưới 18 tuổi theo năm Việt Nam, chưa liên kết tài khoản. Không có hồ sơ thuộc
  diện này thì dùng `{}`. Dùng UUID người tạo thực tế, kể cả người đã rời hoặc
  bị xoá; thiếu căn cứ thì dừng, không tự suy từ người xác nhận đồng thuận.

Schema lịch sử không lưu người tạo, nên tệp thứ hai là căn cứ chuyển đổi được
owner duyệt. Người tạo còn `main` cùng nhà trở thành giám hộ; trường hợp khác
dùng Chủ hộ đã chỉ định. Không đưa các tệp ánh xạ vào Git hoặc báo cáo công khai.

```bash
yarn ops:v1-family-owners --env sit --mapping /private/path/family-owners.json --creators /private/path/profile-creators.json --dry-run
yarn ops:v1-family-owners --env sit --mapping /private/path/family-owners.json --creators /private/path/profile-creators.json
```

`--env` kiểm tên DB và role hiện tại là `angia_<env>` (`dev`, `sit`, `prod`, `test`);
không chọn URL thay cho `DATABASE_OWNER_URL`. Bỏ `--env` vẫn kiểm role sở hữu bảng.
Một transaction khoá các bảng đối chiếu; dry-run thực hiện đủ kiểm tra/constraint
rồi rollback. Báo cáo JSON đếm trước/sau theo nhà cho sáu bảng dữ liệu chính,
quota và operation OCR; kiểm checksum nội bộ bảo toàn cả nội dung, liên kết,
đồng thuận và số lượt. Lệch hoặc xung đột với Chủ hộ/giám hộ đã gán thì rollback,
exit 1. Chạy lại cùng ánh xạ không ghi thêm; không dùng lệnh này để chuyển quyền.
Lệnh có thể chặn ghi trong thời gian ngắn; lock timeout 5 giây, statement timeout
60 giây. Chỉ chạy trên bản sao đã chọn cho E27-S6-T2 trước khi xét Production.

Kiểm tra local E27-S6-T1: **28 integration và 16 unit/phân tầng PASS**, gồm
TC-815–818 và các ca rollback trên PostgreSQL Testcontainers dữ liệu giả.
`verify:fast` chưa xanh vì metadata AppleDouble `._*`
và hai test ngoài phần thay đổi (`healthDataRoutes`, `ProfileFrameNavigation`).
Chưa chạy chuyển đổi trên DB ứng dụng, bản sao SIT hoặc Production; chưa đóng
toàn bộ DoD E27. Hướng dẫn đối chiếu: `../../Docs/angia/10-setup-and-ops-guide.md` §10.3.

## Cô lập dependency glob của build native

Ghim node-gyp 13.0.2 bằng Yarn patch và thay riêng dependency
node-gyp/tinyglobby bằng glob 14.0.4 đã có trong lockfile. Helper chỉ nhận
hai mẫu `build/*.sln` và `build/*.mk`; lọc bằng stat để giữ hành vi chỉ lấy tệp,
bao gồm symlink tới tệp, loại thư mục và symlink hỏng. Không thay Argon2,
tham số băm mật khẩu, cơ chế xác thực hoặc phân quyền dữ liệu.

Giữ nguyên lệnh audit production, không ignore advisory. Đồ thị production
được loại đường dẫn tới picomatch; các công cụ dev vẫn còn picomatch và
không được coi đã vá toàn bộ GHSA-fc5q-39xc-vjpf.

Trước phát hành phải chạy regression tooling/nativeBuildGlobs.test.ts,
kiểm thử hash/verify Argon2 và build image Linux Node 22. Không ghi đã
kiểm native build Windows khi chỉ thử fixture trên Linux. Xem xét gỡ
patch khi upstream cung cấp đường dependency phù hợp đã được kiểm chứng.

## Kiểm tra trình duyệt theo yêu cầu

CI tự động giữ audit dependency runtime, hợp đồng API, typecheck/lint/format,
unit/coverage, integration Testcontainers/RLS và build/budget/model/Docker.
Job verify phụ thuộc bốn nhóm kiểm tra này; lỗi hoặc hủy một nhóm vẫn chặn
triển khai. Bước Playwright --list chỉ thu thập bộ test, không cài hoặc mở
trình duyệt.

Accessibility/axe/Lighthouse chuyển sang workflow Accessibility (manual),
chỉ chạy bằng Actions → Run workflow khi cần kiểm giao diện hoặc chuẩn bị
phát hành Production. Workflow dùng image Playwright có sẵn browser và thư
viện hệ thống, ghim đúng phiên bản của package.json; không chạy apt hoặc
playwright install mỗi lượt. Bộ test và báo cáo vẫn được giữ.

Các thay đổi UI không còn tự động bị chặn bởi accessibility trên mọi PR;
người phụ trách cần chủ động chạy workflow này khi đánh giá chất lượng UI.

## E28-S1-T1 — Đổi vai trò và gỡ thành viên (local 2026-11-19)

`PATCH /api/family/members/{targetAccountId}` nhận một trong hai body:

```json
{ "action": "change_role", "role": "main" }
```

```json
{ "action": "remove" }
```

Vai trò nhận `main` hoặc `member`; thành công trả `204`, `Cache-Control: no-store`.
Chỉ `main` cùng nhà quản lý người khác; tự thao tác bị chặn (`403 ERR_FORBIDDEN`),
tự rời nhà thuộc E28-S1-T2. Chủ hộ được bảo vệ (`403 ERR_OWNER_PROTECTED`);
người giám hộ cuối cùng không được hạ/gỡ (`409 ERR_LAST_GUARDIAN`).
Đích khác nhà hoặc không tồn tại cùng trả `404 ERR_NOT_FOUND`.

Một transaction `withFamilyScope` kiểm lại quyền DB, xử lý người giám hộ,
giữ hồ sơ liên kết ở nhà với trạng thái `withdrawn`, bỏ liên kết, thu hồi push,
ghi cửa sổ 168 giờ và `last_member_removed_at`, rồi gỡ tài khoản khỏi nhà.
Bộ audit chung thêm `member_role_changed` và `member_removed`; chỉ sự kiện gỡ
có metadata cố định `{ "reason": "removed_from_family" }`, không nhận metadata
từ request. Lỗi audit rollback toàn bộ thao tác. Không đổi schema/migration.

Hồi quy household/audit: **105/105 integration test PASS** trên bản sao tạm.
`yarn verify:fast` trên bản sao không có metadata macOS: **3456/3456 unit test
PASS**, typecheck PASS. Ở volume gốc, `verify:fast` lỗi parse `._*`; lint còn
quét metadata và worktree cũ trong `.claude/worktrees`. Không coi hai cổng
ở volume gốc đã PASS; không sửa cấu hình hoặc dọn các artifact đó trong task này.

Kiểm cuối sau đồng bộ OIDC/CI: `yarn verify` trên bản sao mã hiện hành PASS,
gồm **3460/3460 unit test** và các cổng lint/format/dup/knip/build/budget/model.
Integration E28/audit ngay trên volume gốc: **14/14 PASS**; khung cô lập nhà:
**315 PASS, 10 TODO** thuộc task sau. Manifest SHA-256 **27/27 tệp** và báo cáo:
`../../Docs/angia/acceptance/v1.0/evidence/e28-s1-t1-2026-11-19.md`.

TC-787 mới kiểm tiền đề tạo cửa sổ tải đúng 168 giờ; kiểm tải hồ sơ đầu-cuối
chờ SPEC-072/E29. UI quản lý thành viên thuộc E28-S3; chưa nghiệm thu SIT.

## E28-S1-T2 — Tự rời nhà (local 2026-11-19)

`POST /api/family/leave` nhận body strict `{ ownProfileDisposition?: "keep" | "delete" }`,
trả `204`, `Cache-Control: no-store`; yêu cầu phiên và CSRF. Tài khoản có hồ sơ
liên kết phải chọn giữ hoặc xoá. Chủ hộ còn người khác nhận
`409 ERR_OWNER_MUST_TRANSFER`; Chủ hộ một mình nhận
`409 ERR_OWNER_MUST_DELETE_FAMILY`. Người giám hộ cuối cùng nhận
`409 ERR_LAST_GUARDIAN` kèm `details.profileIds`.

Một transaction `withFamilyScope` khoá và kiểm lại DB, xử lý tư cách giám hộ,
gỡ membership/liên kết và đăng ký Push, ghi audit `member_left`.
`keep` giữ nguyên hồ sơ và đồng thuận. `delete` xoá hồ sơ cùng dữ liệu phụ thuộc,
enqueue `purge-profile-objects` cùng transaction rồi dọn ảnh sau COMMIT.
Cửa sổ tải lịch sử cùng hồ sơ được bỏ tham chiếu hồ sơ, giữ thời hạn;
không tạo cửa sổ tải mới hay cập nhật thời điểm gỡ thành viên.
Lỗi queue/audit rollback toàn bộ; lỗi storage sau COMMIT để job vét dọn tiếp.
Không đổi schema hoặc migration.

TC-790–796 kiểm local: **15 integration mới**, cùng hồi quy T1/audit
**43/43 PASS**; khung truy cập chéo gia đình **4/4 PASS**.
`yarn verify:fast` trên bản sao sạch metadata PASS (typecheck + 165 unit liên quan); full `yarn verify` PASS (3466 unit test/684 suite, sinh API, lint/format/dup/knip/build/budget/model). Build còn cảnh báo chunk lớn nhưng cổng budget PASS.
Volume gốc còn lỗi metadata macOS `._*.ts`; không coi cổng verify tại volume gốc PASS.
Bản sao tạm không chứa metadata được dùng để kiểm chứng cùng source.
Chưa nghiệm thu Garage/SIT, Push service hoặc UI; UI rời nhà thuộc E28-S3-T2.
Bằng chứng: `../../Docs/angia/acceptance/v1.0/evidence/e28-s1-t2-2026-11-19.md`.

## E28-S2-T1 — Trao quyền Chủ hộ (local 2026-11-19)

- `POST /api/family/ownership-offers`: body strict `{ targetAccountId }`, trả `201`
  với `{ id, targetAccountId, status: "pending", createdAt }`.
- `POST /api/family/ownership-offers/{id}/decision`: body strict `{ accept: boolean }`, trả `204`.
- `DELETE /api/family/ownership-offers/{id}`: Chủ hộ gửi đề nghị thu hồi, trả `204`.

Yêu cầu phiên/CSRF và `Cache-Control: no-store`. Chỉ Chủ hộ đề nghị cho một
Đồng quản lý khác cùng nhà; chỉ người nhận trả lời. Một nhà tối đa một đề nghị
`pending` (`409 ERR_OWNERSHIP_TRANSFER_PENDING`). Quyền chỉ đổi khi chấp nhận;
cả Chủ hộ mới và cũ vẫn có vai trò `main`.

Trong `withFamilyScope`, khoá account theo UUID → family → offer, kiểm lại DB,
đổi cờ sở hữu/kết thúc đề nghị và ghi audit cùng transaction. Hạ vai trò, gỡ hoặc
tự rời nhà tự chuyển đề nghị liên quan từ `pending` sang `revoked` kèm `decidedAt`
và audit `ownership_transfer_revoked` do người thực hiện thao tác; nâng vai trò
lại không khôi phục đề nghị cũ. Lỗi audit rollback toàn bộ. Không đổi schema.

TC-797–801 kiểm local: **14 integration mới PASS**, hồi quy household/audit
**134/134 PASS**, khung cô lập **315 PASS/6 TODO**. `yarn verify:fast` trên bản sao
sạch metadata PASS (typecheck + 163 unit liên quan). Full `yarn verify` PASS (3470 unit test, sinh API, lint/format/dup/knip/build/budget/model). Volume gốc còn metadata macOS `._*` gây lỗi runner.
Chưa nghiệm thu SIT/UI; UI trao quyền thuộc E28-S3-T2.
Bằng chứng: `../../Docs/angia/acceptance/v1.0/evidence/e28-s2-t1-2026-11-19.md`.

## E28-S2-T3 — Người giám hộ hồ sơ trẻ (local 2026-11-19)

Hồ sơ dưới 18 tuổi theo năm Việt Nam, chưa liên kết tài khoản, tự gán người tạo
làm giám hộ trong cùng transaction. Chỉ giám hộ hiện tại thêm được người thứ hai
là `main` cùng nhà; tối đa hai người. Hai API cần phiên, CSRF và vai trò `main`:

- `POST /api/health-profiles/{id}/guardians`, body strict `{ guardianAccountId }`.
- `DELETE /api/health-profiles/{id}/guardians/me`, chỉ tự gỡ; người cuối bị chặn.

Thành công trả 204/no-store. Thay đổi và audit cùng transaction `withFamilyScope`;
khóa account theo UUID → family → profile. Không đổi schema. Sinh/gửi nhắc thuốc,
đọc lời nhắc và xác nhận liều dùng giám hộ hiện hành làm người nhận cho hồ sơ trẻ;
không cho cấu hình người nhận riêng. Nhắc tái khám giữ quy tắc SPEC-051 hiện có.

Owner chọn chặn `ERR_VALIDATION` các chuyển đổi để lại hồ sơ trẻ không có giám hộ:
sửa người lớn/không rõ năm sinh thành trẻ, tự/admin gỡ liên kết, gỡ thành viên hoặc
rời nhà chọn giữ hồ sơ trẻ đang liên kết. Rời nhà chọn xoá hồ sơ vẫn được phép.
Quy trình chọn giám hộ khi chuyển đổi để task sau. Khi liên kết hoặc hồ sơ trở
thành người lớn, bỏ tư cách giám hộ và ghi audit cùng transaction.

TC-809–814 kiểm local; hồi quy API/worker/cô lập **611 PASS/2 TODO có sẵn**.
`yarn verify:fast` trên bản sao sạch metadata PASS (typecheck + 153 unit liên quan).
Full `yarn verify` dừng tại TC-860 do màu cứng có sẵn trong `clay-icon.css`
(3501 unit PASS/1 FAIL); duplication, knip, build, budget và model check chạy riêng PASS.
Volume gốc còn lỗi runner do metadata macOS `._*`; không ghi full verify PASS.

Chưa nghiệm thu SIT/UI; giao diện giám hộ thuộc E28-S3-T3. Bằng chứng và giới hạn
kiểm chứng: `../../Docs/angia/acceptance/v1.0/evidence/e28-s2-t3-2026-11-19.md`.

## E28-S3-T1 — API danh sách thành viên

`GET /api/family/members` trả `200`, `Cache-Control: no-store` và
`{ members: [{ accountId, displayName, role, isOwner, isSelf }] }`.
Cả `main` và `member` có nhà đều được đọc; chưa có nhà trả `403 ERR_FORBIDDEN`,
chưa đăng nhập trả `401`. Chỉ chọn tài khoản có `family_id` của phiên, đọc trong
`withFamilyScope` bằng role runtime và kiểm lại membership trong cùng câu SELECT.
Chủ hộ đứng trước, rồi `main`, rồi `member`; mỗi nhóm theo `displayName`
(collation mặc định của DB), cuối cùng theo UUID. Không trả email, username,
ID hồ sơ hoặc dữ liệu sức khỏe. Không đổi schema, domain hay UI.

Unit test: `application/listHouseholdMembers.test.ts`; kiểm quyền, thứ tự,
cờ Chủ hộ/bản thân, khóa JSON và cô lập chéo nhà tại
`apps/api/src/features/household/presentation/listHouseholdMembers.int.test.ts`.

## E28-S3-T2b — Nhà của tôi và quản lý thành viên

Menu tài khoản có một mục **Nhà của tôi** (`/family/home`). Trang dùng tên nhà,
danh sách và số lượng từng vai trò từ API; không dựng số điện thoại, ngày tham gia
hay mã nhà. Quyền mời, đổi vai trò, gỡ thành viên và quản trị nhà giữ luật hiện có.
Chủ hộ và hàng “Bạn” không chọn được. Thiếu Đồng quản lý thì khối Trao quyền giữ
câu hướng dẫn và vô hiệu hoá nút gửi.

Chi tiết thành viên nằm ở panel bên phải từ 1024px; dưới mốc này là native modal
bottom sheet. Sheet focus nút đóng, Escape đóng và trả focus về hàng đã chọn,
dùng cơ chế khoá cuộn modal chung. Đổi kích thước giữ vai trò đang chọn và trạng
thái request; khi xác nhận gỡ đang mở, giữ vỏ hiện tại đến lúc xác nhận đóng để
không đảo thứ tự modal. Thành công tải lại danh sách và đề nghị trao quyền (có thể
đã bị thu hồi khi đổi vai trò/gỡ người nhận), hiện toast và đóng chi tiết.

E2E tại `apps/web/e2e/householdMembers.spec.ts`, gồm mốc 1023/1024px, focus sau
click (WebKit), Escape, modal lồng nhau, resize và lỗi bảo vệ. Đã chạy
`playwright.account.config.ts` (members, home, invitations): đạt; chưa nghiệm thu SIT.

## Duyệt giấy tờ — UI owner duyệt 2026-11-26

Owner xác nhận UI PASS và yêu cầu cập nhật tài liệu, commit. Checkpoint chỉ bàn giao
`/review` và `/review/:documentId`, thuộc hàng chờ của E30-S2-T2 và phần duyệt của
E30-S2-T3; chưa nghiệm thu trọn hai task hoặc Epic 30.

- Nguồn Stitch: project `12209147960511107004`, Desktop
  `bb3e9ab11d584919800215e149f0299b`, Mobile `6f8ab883ba0d48dd89dc27db4a3de755`.
- Desktop: hàng chờ trên ảnh ở cột trái, form đối soát bên phải; ảnh dính khi cuộn.
  Mobile: danh sách/chi tiết theo route, ảnh mở toàn màn hình, form một cột và nút lưu
  dính đáy. Màu theo token hai nền, Newsreader, icon cục bộ và cỡ chữ hiện hành.
- Chuyển giấy trước/sau và vị trí chỉ tính trong các chứng từ đã tải; “Xem thêm”
  vẫn tải theo cursor. Không coi số đã tải là tổng hàng chờ khi còn trang tiếp theo.
- Giữ luồng lưu/CSRF, xử lý trùng/xung đột, phân quyền và nhập tay khi hết lượt.
  Ảnh chỉ là bản đã che; không thêm số chính xác AI, chứng nhận HIPAA hoặc tư vấn y khoa.
- “Nắn giấy” và “Gợi ý vùng che” vẫn ở **Chụp/chọn ảnh → Che thông tin/Chỉnh lại**,
  trước khi gửi; gợi ý phụ thuộc `features.redactionSuggestions`/`OCR_MASK_URL`.
  Không chuyển hai công cụ sang trang review. Commit không bao gồm nhóm thay đổi
  riêng của trang upload/danh sách giấy tờ; có component form và CSS dùng chung.

Kiểm local trên bản sao chỉ chứa nội dung commit: `yarn verify:fast` PASS (typecheck
và 43 test/9 tệp), 344 unit liên quan, ESLint, build
và 18/18 E2E Chromium/WebKit PASS; 360/768/1024/1440px, hai nền/hai cỡ chữ,
chữ 200%, tên dài, axe nội dung review ở 360px không có serious/critical.
Bundle review 198,3 KB gzip, mọi trang đầu đạt 200 KB và TC-729 PASS.
Chạy lại: `yarn playwright test --config playwright.review.config.ts`.
Chưa chạy full `yarn verify`, PR/push/deploy hoặc kiểm SIT/Production từ checkpoint này.
Bằng chứng chi tiết: `../../Docs/angia/acceptance/v1.0/evidence/e30-review-2026-11-26.md`.

## E30-S2-T3 — Che ảnh và nhập tay, UI duyệt 2026-11-26

Owner xác nhận **“UI đã pass giúp tôi cập nhật tài liệu liên quan và commit”**.
Checkpoint này bàn giao phần trình che/nắn ảnh, xem bản sẽ tải lên và nhập tay
của **E30-S2-T3**; phần review đã được duyệt tại commit `af176aeb`.
Không suy từ duyệt UI local thành nghiệm thu SIT/Production hoặc đóng toàn Epic 30.

- Trình che tại `/upload` dùng Clay Bento, Newsreader, token sáng/tối và cỡ chữ
  hiện hành; nhóm công cụ có focus bàn phím, wrap trên mobile và vùng chạm theo token.
- Giữ cắt/che/xoay/hoàn tác, chỉnh tọa độ, giới hạn 32 vùng; nắn giấy trên thiết bị.
  Gợi ý vùng che vẫn do người dùng yêu cầu, phụ thuộc feature hiện có; ảnh chỉ gửi
  máy chủ AN GIA theo ngoại lệ BR-085, không tự bật hoặc tự che thay người dùng.
- Xem đúng bản xuất trước khi tải; giữ lựa chọn tự nhập/gửi AI, checkbox xác nhận,
  cảnh báo không có vùng che, chặn AI khi hàng chờ đầy và xử lý quota hiện có.
- `/profiles/:profileId/manual` đồng bộ thẻ/form/trạng thái lưu, nút về hồ sơ;
  giữ đồng thuận, quyền main/member, loại dữ liệu theo hồ sơ, trùng và xung đột.
  Form xét nghiệm/số đo và notice dùng chung có ảnh hưởng giao diện review.
- Không đổi API, application/domain, schema, dependency, env hoặc quyền truy cập.

Kiểm local: `yarn verify:fast` (56 test/10 tệp), 345 unit liên quan, ESLint,
Prettier, build, 24/24 E2E Chromium/WebKit và `perf:budget` PASS.
Review 198,5 KB; nhập tay 189,6 KB; upload 189,5 KB gzip.
Chưa chạy full `yarn verify` hoặc kiểm SIT/Production. Chi tiết phạm vi axe và
những luồng chưa tự động kiểm tại
`../../Docs/angia/acceptance/v1.0/evidence/e30-s2-t3-2026-11-26.md`.
