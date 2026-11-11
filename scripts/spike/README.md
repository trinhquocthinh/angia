# Spike danh tính — E24-S1-T1/T2

Kiểm chứng một lượt trên Authentik SIT: tạo user tổng hợp trong
`angia-sit-users`, đặt mật khẩu, kiểm đúng/sai mật khẩu và xoá user.
Không nối adapter vào API đang chạy; không ghi token, mật khẩu hoặc cookie.
Nguồn: Tech Spec §10.1, Master Plan E24-S1-T1, TC-873 (một phần).

## Điều kiện trước khi chạy

- HP-2: service account riêng `angia-sit-svc`, token lưu trong Infisical;
  quyền đọc nhóm, tạo user kèm nhóm, đặt mật khẩu và xoá user thử trong
  `angia-sit-users`. Quyền thực tế và ranh giới SIT/Prod phải kiểm trên instance.
- Không thay `AUTHENTIK_API_TOKEN` của worker: đó là token đồng bộ chỉ đọc.
- Đưa `SPIKE_AUTHENTIK_API_TOKEN` và `SPIKE_AUTHENTIK_FLOW_SLUG` vào môi trường
  tiến trình từ Infisical. Không dán giá trị secret vào lệnh, log hoặc Git.
- Slug trỏ flow authentication của SIT cần kiểm. Spike hỗ trợ Identification
  (có thể kèm mật khẩu), Password và hoàn tất bằng User Login. MFA, captcha,
  consent hoặc stage khác trả `idp_unsupported_stage`; không bỏ qua policy để đạt.

## Chạy

```sh
STACK=sit yarn identity:spike
```

Script chỉ chấp nhận `STACK=sit`, cố định API
`https://auth.toniboy.io.vn/api/v3/` và nhóm `angia-sit-users`.
Nó không tự nạp `.env` hay lấy token đồng bộ của worker.
Flow executor dùng cookie jar mới cho mỗi lần kiểm mật khẩu, không gửi token
dịch vụ; API quản trị dùng Bearer token. Sau khi flow hoàn tất, kiểm
`core/users/me/` phải trả đúng username/uid, không chỉ dựa vào redirect.

Kết quả đạt: exit 0, JSON có `passwordVerified`, `wrongPasswordRejected`,
`deleted` đều `true`, kèm `verifyPasswordMs`. Mỗi flow có timeout tổng 10 giây;
mỗi lệnh quản trị timeout 10 giây. Đây chưa phải phép đo 50 lượt của E24-S1-T2
và chưa chứng minh trung vị đăng nhập ≤ 1 giây hoặc toàn bộ TC-873.

Nếu exit 1: giữ mã `idp_*`, không lưu response gốc chứa dữ liệu/secret.
Tên `spike-e24-<UUID>` được in trước khi tạo để dọn thủ công nếu cần.
`idp_cleanup_failed` nghĩa là chưa xác nhận xoá được user.
Nếu mất mạng/response hỏng ngay sau lệnh tạo, có thể Authentik đã tạo user
nhưng script chưa nhận được ID để xoá. Tìm đúng username tổng hợp vừa in trong
nhóm SIT và xoá thủ công; không tự retry lệnh tạo hoặc xoá user khác.

## Kiểm tra local

```sh
yarn vitest run --project unit apps/api/src/shared/identity apps/api/src/shared/config/loadIdentitySpikeConfig.test.ts scripts/spike/runIdentityProviderSpike.test.ts
yarn verify:fast
```

Unit test giả lập HTTP, không gọi Authentik. Chỉ đánh dấu nghiệm thu SIT sau
khi có kết quả chạy thật; đo đổi mật khẩu/khoá/mở khoá 50 lượt thuộc T2.

## Đo 50 vòng — E24-S1-T2

Trước khi chạy:

1. Trong Initial Permissions `angia-sit-spike-created-users`, bổ sung
   **Can change User** (`authentik_core.change_user`); giữ ba quyền
   `view_user`, `delete_user`, `reset_user_password` đã có. Quyền mới chỉ áp dụng
   trên user mới do tài khoản mang role tạo ra; không cấp change/reset/delete toàn cục.
2. Nếu đã gỡ `Can add User` khỏi global permissions của role spike, cấp lại
   quyền này theo ngoại lệ owner đã duyệt. Token có quyền tạo user toàn cục,
   không được xem đây là cấu hình HP-2 đã giới hạn đầy đủ theo nhóm.
3. Tạo API token ngắn hạn cho `angia-sit-svc`, lưu Infisical và nạp vào biến
   môi trường `SPIKE_AUTHENTIK_API_TOKEN`; flow đã kiểm là `default-authentication-flow`.
4. Tính **tổng số phút công sức đã dùng cho E24-S1**, gồm T1, T2 và chuẩn bị
   hạ tầng; truyền bằng `--spent-minutes`. Không đặt 0 để bỏ qua trần 6 giờ.

Ví dụ dưới đây giả sử đã dùng **120 phút**; thay bằng số thực tế trước khi chạy:

```sh
STACK=sit SPIKE_AUTHENTIK_FLOW_SLUG=default-authentication-flow \
  yarn identity:spike:measure --spent-minutes=120 --origin=mac-tailscale
```

Đổi `--origin` cho đúng máy/đường mạng thực tế. Mỗi báo cáo giữ riêng nguồn đo,
không gộp số đo từ Mac/Tailscale với backend SIT. Thời gian đo bao gồm toàn bộ
`verifyPassword` qua HTTP, cookie, flow executor và xác nhận `/users/me/`.

Mỗi vòng: tạo user → đăng nhập → đổi mật khẩu → đăng nhập bằng mật khẩu mới →
từ chối mật khẩu cũ → khoá → đăng nhập đúng mật khẩu phải trả `ERR_ACCOUNT_LOCKED` →
mở khoá → đăng nhập lại → xoá user. Nhánh khoá vẫn thử flow thực tế trước khi
dùng API trạng thái để phân loại lỗi; không chỉ kiểm `is_active` rồi báo đạt.

Runner chạy tuần tự, không retry, dừng ở vòng lỗi đầu tiên. Ngân sách còn lại
là `360 - spent-minutes`. Khi hết thời gian hoặc nhận Ctrl+C/SIGTERM, không
bắt đầu thao tác nghiệp vụ tiếp theo; lời gọi đang chạy có timeout 10 giây.
Vẫn thử xoá user đã biết ID, kể cả hết ngân sách. Không tính việc dọn kéo dài
là phép đo đạt trong trần. Kill cưỡng bức/mất kết nối vẫn có thể để lại user.

Script in đường dẫn thư mục tạm `angia-identity-spike-*` chứa:

- `measurements.jsonl`: metadata, username tổng hợp trước mỗi vòng, kết quả
  từng vòng và summary cuối; mỗi bản ghi được ghi trước khi bắt đầu vòng tiếp theo.
- `measurements.md`: bảng thời gian từng bước và kết luận máy tính. Không có
  file này hoặc không có bản ghi summary thì phép đo chưa hoàn tất, không được coi đạt.

Trung vị chính lấy 50 mẫu đăng nhập **đầu vòng**, gồm mẫu đầu tiên; 50 mẫu sau
đổi mật khẩu và sau mở khoá thống kê riêng. `successRate` là số vòng hoàn tất
thành công/chỉ tiêu **50**, không chia cho số vòng đã chạy. `verdict=pass` chỉ
khi đủ 50/50, trung vị ≤ 1000 ms và chưa hết ngân sách; exit 0. Các kết quả khác
exit 1: dừng và trình owner phương án B/ADR/ước lượng lại E26, không tự đổi backend.

TC-875 hiện kiểm timeout adapter bằng HTTP giả lập. Chưa kiểm API trả 503/không
tạo phiên: route `password-login` mới chưa được triển khai; không ghi toàn bộ
TC-875 PASS. Không giả vờ có kết quả timeout SIT trong bảng đo 50 vòng.

Sau khi chạy, giữ báo cáo trước khi thư mục tạm bị dọn, kiểm user còn sót nếu
lỗi, rồi xoá token và gỡ global `Can add User`. Gửi summary/bảng đo để owner
duyệt kết luận A23; không gửi token, mật khẩu, cookie hoặc response gốc.

Tham khảo API chính thức: [Flow executor](https://api.goauthentik.io/flow-executor/),
[tạo user](https://api.goauthentik.io/reference/core-users-create/),
[đặt mật khẩu](https://api.goauthentik.io/reference/core-users-set-password-create/).
