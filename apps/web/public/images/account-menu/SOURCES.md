# Icon 3D menu tài khoản và thông báo

Nguồn: Stitch **Project An Gia**, project `12209147960511107004`, owner yêu cầu ngày 2026-11-25.
Các màn nguồn là `IMAGE`, không có HTML/code export. URL ảnh hosted cần xác thực;
đã lấy qua connector Stitch sau khi `curl -L` trực tiếp trả 401.

| Asset                      | Screen nguồn                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| `home-3d.png`              | `030a2da2cc2846bfbd55527bd2ce87e3`                                         |
| `notification-bell-3d.png` | `79f2675036384e50b9f67dbd85c18495`                                         |
| `settings-3d.png`          | `7ab674e2a4bc49c2b81d0ae84fd79f3f` (đối tượng dưới trái)                   |
| `account-settings-3d.png`  | `3410b9d76cf74777a7cfc178f17a5163` (bánh răng riêng cho Quản lý tài khoản) |
| `logout-3d.png`            | `7ab674e2a4bc49c2b81d0ae84fd79f3f` (đối tượng dưới phải)                   |
| `profile-card-3d.png`      | `7ab674e2a4bc49c2b81d0ae84fd79f3f` (đối tượng trên phải)                   |

Dẫn xuất bằng imagegen: tách nền trắng/ô caro sang alpha; tách các đối tượng và
bỏ chữ mẫu; hồ sơ dùng thẻ y tế vàng–mint có khiên dấu kiểm theo ảnh owner chọn lại ngày 2026-11-25, bỏ nhãn chữ phía dưới; chuông bỏ badge `+1`
được vẽ trong ảnh để không tạo bộ đếm giả. Không thêm tile/viền/nền CSS cho icon.

Menu hiển thị 40×40px, chuông 30×30px trong vùng chạm 48×48px. Animation chuông
chạy một lần khi xuất hiện, hai nhịp khi hover/focus; `prefers-reduced-motion`
tắt animation. Asset lưu nội bộ, không tải từ Stitch lúc chạy ứng dụng.

Owner chọn lại icon Quản lý tài khoản: bánh răng gốm xanh, lõi vàng hổ phách; nền và lỗ giữa trong suốt. Asset riêng `account-settings-3d.png`; `settings-3d.png` tiếp tục dùng cho Quản trị hệ thống.
