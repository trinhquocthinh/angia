# Văn bản pháp lý — E26-S5-T1

`terms.md` và `privacy.md` hiện chỉ là placeholder `0.0-draft`, **chưa được luật sư duyệt, không dùng cho Production**. Chưa chạy seed vào DB ứng dụng.

## Bản nháp nội dung 0.1-draft (2026-11-17)

`terms-v0-1-draft.md` và `privacy-v0-1-draft.md` là nội dung soạn theo Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP và BR/SPEC của dự án. Đã có trong `manifest.json` (`publishedAt` 2026-11-17, `material=true`) và được phục vụ trên local/image; **chưa seed ở môi trường nào**. Seed bản này sẽ buộc mọi tài khoản đồng ý lại, và nội dung còn `[CẦN ĐIỀN]`/`[CẦN XÁC NHẬN]` — chỉ seed local/SIT để xem thử, không seed Production. Bản phát hành thật là tệp và version mới sau khi luật sư duyệt; allowlist local tự lấy từ manifest, chỉ cần thêm dòng `COPY` trong `apps/web/Dockerfile`. Không ghi đè `terms.md`/`privacy.md`: bản `0.0-draft` đã seed trên SIT ngày 2026-11-16, đổi byte sẽ làm seed lỗi hash.

## Đọc văn bản trên local

Khi chạy `yarn dev` hoặc `yarn workspace @angia/web dev`, Vite phục vụ công khai
`/legal/terms.md` và `/legal/privacy.md` từ hai tệp trong thư mục `legal/` ở gốc repo.
`yarn workspace @angia/web preview` dùng cùng cấu hình. Nội dung trả dạng văn bản
UTF-8; đường dẫn khác trong `/legal/` trả 404, không chuyển về SPA.
Không cần sao chép các tệp này vào `public/`. Docker/Nginx vẫn phục vụ bản được
đóng gói trong image như trước.

## Seed vận hành

Chạy từ gốc repo với `DATABASE_OWNER_URL` của môi trường đích:

```sh
corepack yarn ops:legal-seed
```

Script đọc `legal/manifest.json`, kiểm đường dẫn bên trong `legal/`, tính SHA-256 từ byte nội dung và ghi bằng role owner trong một transaction. `content_path` lưu đường dẫn tương đối. Chạy lại không thêm dòng trùng `(kind, version)`; khác hash, `material`, `publishedAt` hoặc đường dẫn của bản đã có thì lỗi, rollback và exit 1. Không sửa bản cũ. Log thành công có số bản thêm mới / đã có.

Khi có nội dung đã được duyệt: tạo tệp nội dung mới và thêm entry có version mới vào manifest, giữ nguyên byte và metadata của phiên bản đã seed. Đặt `publishedAt` ISO và `material` theo quyết định owner. Không dùng migration dữ liệu để phát hành văn bản.

## API và gate

- `GET /api/legal/current` công khai: trả hai bản có `published_at <= now` mới nhất, URL là `/<content_path>`. Thiếu kind trả `ERR_INTERNAL`.
- `POST /api/me/legal-acceptances`: phiên + CSRF, body `{ "versionIds": ["uuid"] }`, từ 1 đến 2 UUID không trùng. Chỉ nhận ID hiện hành, sai bất kỳ ID nào trả 409 `ERR_LEGAL_VERSION_OUTDATED` kèm `details.current`, không ghi gì. Thành công trả 204, `Cache-Control: no-store`.
- Gate sau `requireSession` và `requirePasswordChanged`, áp dụng cả local/OIDC và SystemAdmin. Với từng kind, ngưỡng là bản trọng yếu đã phát hành mới nhất; nếu chưa có bản trọng yếu thì dùng bản hiện hành. Đồng ý một bản cùng kind có ngày phát hành từ ngưỡng trở đi là đạt. Bản không trọng yếu mới không che ngưỡng trọng yếu cũ.
- Thiếu terms hoặc privacy: đóng gate, chỉ warn `Thiếu văn bản pháp lý hiện hành`. Lỗi DB do `onError` xử lý. Gate đọc một truy vấn SQL mỗi request cần kiểm.
- Miễn chính xác: `GET /api/me`, `POST /api/auth/logout`, `POST /api/me/password`, `POST /api/me/local-credential`, `POST /api/me/legal-acceptances`. Route công khai không chạy gate. Khi có route tải dữ liệu SPEC-072 và xoá tài khoản SPEC-073, thêm miễn theo method + path cùng test.
- Bản ghi đồng ý dùng `accounts.legal_ref`, chỉ INSERT/SELECT, không sửa/xoá lịch sử. Không cần family scope vì bảng account và legal không có dữ liệu sức khỏe, giống repository phiên/đổi mật khẩu. Route thuốc vẫn dùng scope và kiểm quyền hiện hữu sau gate.

Fixture `seedAccount` mặc định seed và đồng ý văn bản hiện hành. Dùng `{ legalAccepted: false }` cho ca chưa đồng ý. Integration app vẫn lắp gate với repository thật; unit dùng `createStubLegalDeps(false)` để kiểm trạng thái chưa đồng ý.

## Đồng bộ đặc tả ngoài repo

Cần đồng bộ quyết định owner 2026-11-14 vào `Docs/angia/02-business-rules.md` (BR-067) và `05-tech-spec-architecture.md` (§3 và mục văn bản pháp lý): ngưỡng trọng yếu, bản chưa phát hành, allowlist, seed vận hành thay migration, và tình trạng placeholder. Sandbox hiện chỉ cho ghi trong repo; patch cập nhật hai tài liệu được cung cấp riêng trong báo cáo, chưa áp dụng vào thư mục Docs.
