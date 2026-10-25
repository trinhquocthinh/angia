# Ảnh HEIC thật cho spike giải mã (E1-S1-T2)

Ảnh chụp từ iPhone có thể chứa EXIF/GPS và nội dung cá nhân nên mọi tệp trừ README đều bị `.gitignore` chặn.

## Chuẩn bị

Chép **5 ảnh HEIC gốc** chụp bằng iPhone vào thư mục này (AirDrop/cáp, **không** qua ứng dụng nhắn tin vì sẽ bị chuyển sang JPEG). Nên phủ:

- Ảnh 12 MP chụp chứng từ thông thường (đơn thuốc, phiếu xét nghiệm).
- Ít nhất 1 ảnh 24/48 MP (iPhone 14 Pro trở lên) để đo trường hợp nặng nhất.
- Ít nhất 1 ảnh chụp dọc để kiểm tra hướng ảnh sau chuyển đổi.

## Chạy

```bash
yarn heic:spike            # mặc định đọc fixtures/heic
yarn heic:spike <thư-mục>
yarn heic:spike:docker     # Linux + Node 22, giới hạn 512 MB như angia-worker — số liệu đưa vào hồ sơ
```

Mỗi cặp (ảnh, pipeline) chạy trong một tiến trình con riêng để RSS đỉnh không lẫn giữa các lượt; báo cáo ghi vào `reports/`.

| Pipeline       | Mô tả                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| `heic-convert` | Phương án Tech Spec §1: libheif WASM → JPEG (jpeg-js) → `sharp` → WebP.      |
| `heic-decode`  | Bỏ bước JPEG thuần JS: RGBA từ libheif WASM đưa thẳng vào `sharp` → WebP.    |
| `sharp-native` | Đối chứng: libvips dựng sẵn của `sharp` (chỉ AV1) — dự kiến không giải HEVC. |

Ngưỡng R4 (Tech Spec): ≤ 30 s/ảnh và RSS đỉnh < 512 MB (`mem_limit` của `angia-worker`).
