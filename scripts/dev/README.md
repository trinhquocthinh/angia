## Seed UI Nhắc thuốc — E30-S2-T1

Chạy từ thư mục gốc sau khi đã có DB dev/migration và tài khoản thử trong gia đình:

```bash
yarn dev:seed:reminders tester tester1
```

Script đọc `DATABASE_URL` từ `.env`. Chỉ chấp nhận database `angia_dev`, role
`angia_dev_app`, không superuser/BYPASSRLS và không `NODE_ENV=production`.
Không dùng `DATABASE_OWNER_URL`, không tự chạy migration và không đổi `.env`.

Danh sách truyền vào phải gồm ít nhất một Main của mỗi gia đình cần seed.
Thành viên phải có hồ sơ liên kết đã đồng thuận; script không liên kết hồ sơ,
nâng quyền, tạo tài khoản hoặc xác nhận đồng thuận thay cho người thật.
Không tìm đủ tài khoản hoặc không thỏa điều kiện thì rollback toàn bộ.

Các trường hợp để duyệt UI:

| Tài khoản  | Trường hợp                            | Cách mở                                                             |
| ---------- | ------------------------------------- | ------------------------------------------------------------------- |
| Main       | Chưa cấu hình khung giờ/người nhận    | Hồ sơ **Mẫu UI · Chưa thiết lập** → Nhắc thuốc                      |
| Main       | Đủ 4 buổi và người nhận               | Hồ sơ **Mẫu UI · Có lời nhắc** → Nhắc thuốc                         |
| Main       | Trẻ nhận nhắc qua giám hộ             | Hồ sơ **Mẫu UI · Bé An** → Nhắc thuốc                               |
| Main       | Chưa xác nhận / đã xác nhận           | Đường dẫn `pending` / `confirmed` do script in ra                   |
| Main       | Lịch tái khám có hai đơn              | Đường dẫn `revisit` do script in ra                                 |
| Main       | Người nhận cố định của hồ sơ liên kết | Đường dẫn `linked[].settingsForMain` do script in ra                |
| Thành viên | Lời nhắc hồ sơ của mình               | Đường dẫn `linked[].pending` do script in ra, hoặc Hồ sơ của tôi    |
| Thành viên | Đã xác nhận / tái khám hồ sơ của mình | Đường dẫn `linked[].confirmed` / `linked[].revisit` do script in ra |

Thành viên không mở màn cấu hình `/profiles/:id/reminders` của Main; quyền giữ
nguyên SPEC-042. Trạng thái lỗi/quyền và tái khám không còn đơn được dựng trong
fixture E2E, không cần xóa đơn hoặc thay quyền trên DB để thử UI.

Tên hồ sơ/thuốc/cơ sở khám mẫu có nhãn **Mẫu UI/mẫu**, là dữ liệu tổng hợp.
Hồ sơ rỗng chỉ có định danh và receipt mẫu, không có khung giờ/người nhận.
Các dữ liệu mới được ghi trong transaction `withFamilyScope`. UUID ổn định theo
namespace và hồ sơ/ngày/buổi; `ON CONFLICT DO NOTHING` không ghi đè dòng cũ.
Không xóa dữ liệu hay làm rỗng hồ sơ đang dùng; nếu đã thao tác lưu trên hồ sơ
“Chưa thiết lập”, lần seed tiếp theo cũng giữ những thay đổi đó.

Lời nhắc mới có `sent_at` để worker không fan-out Push mẫu. Thuốc mẫu chỉ hiệu
lực trong ngày tạo; đơn mẫu hẹn tái khám cùng ngày để không tạo lịch Push tương lai.
Với hồ sơ liên kết, seed bổ sung xác nhận buổi sáng nếu còn thiếu. Nếu đã có đơn
ghi ngày hẹn, script dùng ngày hẹn đầu tiên và tạo lời nhắc tương ứng nếu chưa
có, với `sent_at`; nếu chưa có đơn hẹn thì tạo đơn/tái khám mẫu cùng ngày.
Ngày dùng múi giờ Việt Nam. Khi kiểm lại ngày khác, chạy lại lệnh để thêm lời
nhắc của ngày đó; các lời nhắc cũ chỉ đọc theo SPEC-046.

Kiểm tra tự động:

```bash
yarn vitest run --project unit scripts/dev/loadReminderSeedOptions.test.ts
yarn workspace @angia/web build
yarn playwright test --config playwright.account.config.ts reminders.spec.ts
yarn verify:fast
yarn perf:budget
```

Playwright dùng API giả và dữ liệu tổng hợp, không nạp seed vào DB hoặc gọi SIT.
