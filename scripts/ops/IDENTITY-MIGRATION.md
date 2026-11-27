# Chuyển đổi danh tính D4 — E26-S4-T3, pha 1 local

Mục đích: kiểm kê account OIDC và gán username do owner duyệt, giữ nguyên ID,
subject, gia đình, vai trò, liên kết hồ sơ và dữ liệu. Người dùng tự thiết lập
credential qua `POST /api/me/local-credential` theo SPEC-060. Script không bao giờ
INSERT/UPDATE/DELETE `account_credentials`, không sao chép mật khẩu OIDC.

**KHÔNG chạy trên Production trong S4-T3.** Chỉ rehearsal trên **BẢN SAO SIT**.
Pha local này chỉ chuẩn bị công cụ và test với dữ liệu giả; chưa nghiệm thu SIT.

## Năm quyết định owner

1. Username kiểm kê để trống khi chưa có; giữ username hiện tại nếu đã có.
   Owner tự điền, không suy từ email/tên. Kiểm `^[a-z0-9._-]{3,32}$` và trùng
   trong file (kể cả username không rỗng của dòng defer), với account khác trong DB.
2. Apply chỉ ghi `accounts.username_normalized` đang NULL, khớp đủ
   `account_id + oidc_subject + family_id + family_role`; hai trường cuối so sánh
   `IS NOT DISTINCT FROM`. Username đã đúng thì giữ nguyên; khác thì conflict.
   Không ghi credential, email, tên hay cột khác.
3. Mọi account có subject đều được kiểm kê, gồm SystemAdmin. Không subject nằm
   trong `skipped` với `no_oidc_subject`, không xử lý.
4. Mỗi account một dòng. Hồ sơ sức khỏe không account không nằm trong mapping,
   không bị chạm tới.
5. Đủ người đã chuyển khi mọi dòng `migrate` có username DB đúng mapping và có
   credential. `defer` báo **chờ khôi phục SPEC-063**. `complete` chỉ true khi `missingUsername`, `usernameMismatch`,
   `missingCredential`, `unmapped`, `missingAccount` đều rỗng; có defer vẫn có thể complete, không có nghĩa mọi người
   hoãn đã được khôi phục. Mapping đặt trong `ops-private/`, không commit.

## Cách chạy

Chạy từ gốc repo. Truyền `DATABASE_OWNER_URL` của **DB sao chép** qua môi trường
shell được owner quản lý (không ghi URL vào log/lịch sử lệnh). Công cụ kiểm URL bằng
Zod và dùng `pg.Client` như legal seed; các lệnh không tự nạp `.env`.

```sh
corepack yarn ops:identity-inventory
# Từ chối tệp đã có. Chỉ khi owner chủ động muốn thay bản kiểm kê:
corepack yarn ops:identity-inventory --force
corepack yarn ops:identity-migrate ops-private/identity-mapping.json
corepack yarn ops:identity-migrate ops-private/identity-mapping.json --apply --database <tên DB đích>
corepack yarn ops:identity-reconcile ops-private/identity-mapping.json
```

Migrate/reconcile mặc định dùng `ops-private/identity-mapping.json` nếu bỏ đường dẫn.
Migrate mặc định dry-run: dùng `BEGIN ISOLATION LEVEL REPEATABLE READ` để giữ snapshot
trước/sau nhất quán, không khóa bảng hay SELECT FOR UPDATE. Vẫn thực hiện UPDATE thử
để PostgreSQL kiểm unique/CHECK, chỉ khóa dòng ngắn tới ROLLBACK. Có thể thêm
`--database <tên DB đích>` để kiểm tên DB. Apply bắt buộc `--database` khớp
`current_database()` ngay sau BEGIN, trước khi khóa/ghi; sai tên thì ROLLBACK.
Chỉ `--apply` mới COMMIT. Bất kỳ dòng migrate lỗi
sẽ ROLLBACK toàn bộ; các dòng defer không được áp dụng hay kiểm username hợp lệ.
Inventory/reconcile dùng `BEGIN READ ONLY`. Inventory tạo thư mục và file riêng tư
(mode file `0600`); không ghi đè nếu không có `--force`.

Apply khóa `accounts` và `account_credentials` ở chế độ SHARE ROW EXCLUSIVE trong
transaction ngắn, rồi SELECT FOR UPDATE các account mapping, để số đếm/checksum
không nhiễu bởi ghi đồng thời. Rehearsal ở cửa sổ không có người dùng ghi dữ liệu;
khóa có thể làm thao tác đăng nhập/enrollment phải chờ. So sánh trước/sau: tổng
account, tổng credential, số account có username và hai checksum:
`checksum` là md5 của `string_agg((to_jsonb(a) - 'username_normalized')::text,
E'\n' ORDER BY a.id)` trên `accounts a`; `credentialsChecksum` là md5 của
`string_agg(to_jsonb(c)::text, E'\n' ORDER BY c.account_id)` trên
`account_credentials c`. Cả hai dùng `COALESCE(..., '')` cho bảng rỗng và phải
không đổi trước/sau. JSON bao phủ mọi cột account ngoài username và mọi cột credential,
giữ phân biệt NULL và tránh nhập nhằng dấu phân cách. Chỉ số có username được
phép tăng đúng `updated`. Báo cáo không chứa username, tên hay hash mật khẩu.

## Quy trình trên BẢN SAO SIT

1. Owner xác nhận đúng DB sao chép. Trước khi chạy, backup bằng owner với
   `pg_dump -Fc`, rồi kiểm `pg_restore --list`. Ví dụ dùng biến `BACKUP_FILE`
   trỏ tới tệp backup riêng tư và `DATABASE_OWNER_URL` đã được cấp trong shell:

   ```sh
   pg_dump --dbname="$DATABASE_OWNER_URL" -Fc --file="$BACKUP_FILE"
   pg_restore --list "$BACKUP_FILE"
   ```

   Bảo vệ backup như dữ liệu gốc; lưu bằng chứng backup/list trong nơi riêng tư.

2. Chạy inventory. Kiểm đủ các account OIDC, admin và skipped; hồ sơ không có
   account không cần mapping. Không dùng `--force` để vô tình xóa bản owner đã duyệt.
3. Owner điền `username`, duyệt từng dòng `migrate` hoặc `defer`. Dòng migrate bắt
   buộc username hợp lệ; dòng defer có thể để trống. Không sửa identity snapshot để
   vượt lỗi khớp. **Tệp riêng tư: không commit, không gửi qua AI/chat.** Giữ bản
   inventory gốc và mapping duyệt trong kho riêng, để biết username nào vốn NULL.
4. Chạy dry-run, đọc số đếm trước/sau; kiểm không có conflict. Không bỏ qua lỗi.
5. Chạy `--apply`, lưu báo cáo mode/số đếm. Chạy lại idempotent: `updated=0`.
6. Người dùng reauth OIDC mới rồi tự thiết lập mật khẩu qua endpoint enrollment
   (cần `LOCAL_ENROLLMENT_ENABLED=true`, CSRF và auth_time tối đa 5 phút). Ops không
   tạo credential thay người dùng. Cấu hình và thao tác UI thuộc rehearsal riêng.
7. Chạy reconcile đến `complete=true`, `missingUsername`, `usernameMismatch`,
   `missingCredential`, `unmapped`, `missingAccount` rỗng. `unmapped` liệt kê accountId
   OIDC trong DB không thuộc `mapping.accounts`, kể cả account tạo sau kiểm kê;
   cần kiểm kê bổ sung và owner duyệt mapping. `missingAccount` liệt kê dòng migrate
   có account đã bị xóa; không đưa lại vào missingUsername/missingCredential.
   Báo cáo chỉ chứa accountId và số đếm. Exit code 1 khi chưa complete/lỗi. Xử lý defer qua
   khôi phục đã xác minh SPEC-063, không đăng ký account mới để nhận dữ liệu cũ.

## Rollback

### (a) Chỉ username chưa có credential

Dùng mapping đã được owner duyệt, giữ nguyên `currentUsername` từ inventory trước
apply. Dừng enrollment trong khi rollback. Hàm
`rollbackIdentityUsernames(client, mapping: IdentityMapping)` trong
`rollbackIdentityUsernames.ts` chỉ lấy dòng `status='migrate'` có
`currentUsername === null`. `$1::uuid[]` là mảng accountId, `$2::text[]` là mảng
username tương ứng từ các dòng này; dùng tham số, không nội suy.

Chạy CLI từ gốc repo với `DATABASE_OWNER_URL` của **DB sao chép** như trên:

```sh
corepack yarn ops:identity-rollback
corepack yarn ops:identity-rollback ops-private/identity-mapping.json
corepack yarn ops:identity-rollback ops-private/identity-mapping.json --apply
```

Đường dẫn mapping là tùy chọn, mặc định `ops-private/identity-mapping.json`.
Mặc định dry-run: `BEGIN` → UPDATE thật để đếm số dòng → `ROLLBACK`.
Chỉ `--apply` mới `COMMIT`; lỗi trong transaction thì `ROLLBACK` rồi báo thất bại
(exit code 1). CLI chỉ in mode và số dòng, không in URL, username hay accountId.
SQL được hàm rollback sử dụng:

```sql
UPDATE accounts a SET username_normalized = NULL FROM unnest($1::uuid[], $2::text[]) AS m(id, username) WHERE a.id = m.id AND a.username_normalized = m.username AND NOT EXISTS (SELECT 1 FROM account_credentials c WHERE c.account_id = a.id)
```

Account vốn có username trước apply, username hiện tại khác mapping hoặc đã có
credential không bị xóa username. Hàm chỉ trả số dòng cập nhật, không tạo credential.
Nếu có username cũ cần phục hồi khác NULL, phải có phương án riêng được owner duyệt.
Lưu bằng chứng trước/sau và chạy đối chiếu.

### (b) Khôi phục toàn bộ

Dừng ghi trên môi trường sao chép. Dùng `pg_restore` bản dump vào **DB sao chép mới**
do owner xác nhận; đối chiếu account ID/subject/gia đình/vai trò/liên kết hồ sơ,
credential, số đếm và trạng thái dữ liệu với backup trước khi quyết định sử dụng.
Không restore đè Production hay DB đang phục vụ. Kiểm `pg_restore --list` mới chỉ
kiểm danh mục; cần rehearsal restore và đối chiếu để chứng minh khôi phục được.

**Rollback không bao giờ tạo/giả credential local.** Hash giả chỉ xuất hiện trong
fixture Testcontainers, không dùng cho rehearsal hay vận hành thật.
