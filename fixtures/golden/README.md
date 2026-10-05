# Bộ ảnh chuẩn kiểm định Vision-LLM (E1-S1-T1)

Thư mục này chứa **chứng từ y tế thật** nên mọi tệp trừ README đều bị `.gitignore` chặn — không commit ảnh, đáp án hay báo cáo lên repo public.

## Cấu trúc

Mỗi ca chuẩn gồm 2 tệp cùng mã:

```
fixtures/golden/
├── don-thuoc-01.jpg              # ảnh .jpg/.jpeg/.png/.webp (HEIC phải chuyển sang JPEG trước)
├── don-thuoc-01.expected.json    # đáp án theo SDD §2.1
├── xet-nghiem-01.jpg
├── xet-nghiem-01.expected.json
└── reports/                      # báo cáo sinh tự động mỗi lần chạy
```

Bộ chuẩn gồm 10 ảnh phủ cả 3 loại: đơn thuốc in máy, phiếu xét nghiệm, màn hình máy đo (huyết áp/đường huyết).

## Đáp án (`*.expected.json`)

Đúng cấu trúc SDD §2.1; trường không có trên chứng từ ghi `null`, không suy diễn.

Quy ước phiếu xét nghiệm (`lab_result`, cũng nằm trong prompt): `testName` giữ nguyên như in (kể cả phần trong ngoặc); `value` bỏ cờ H/L (`"36.6 L"` → `"36.6"`); `unit` chỉ lấy từ cột đơn vị, phiếu không có cột thì `null`; `referenceRange` bỏ ngoặc bao ngoài, giữ đơn vị in trong khoảng (`"(4 - 10 K/uL)"` → `"4 - 10 K/uL"`). Ví dụ màn hình máy đo:

```json
{
  "type": "device_reading",
  "measuredAt": "2026-10-05",
  "measuredTime": "07:10",
  "kind": "blood_pressure",
  "systolic": 145,
  "diastolic": 90,
  "pulse": 78,
  "glucoseValue": null,
  "glucoseUnit": null
}
```

## Chạy

Tạo key tại [openrouter.ai/keys](https://openrouter.ai/keys), nạp credit, điền `OPENROUTER_API_KEY` vào `.env`. Trong **Settings → Privacy** của OpenRouter nên bật chặn nhà cung cấp lưu/huấn luyện dữ liệu; script cũng gửi kèm `provider: { data_collection: "deny", zdr: true }` cho mọi lời gọi.

```bash
yarn ai:golden
```

Mặc định chạy đúng cấu hình vận hành: model chính `google/gemini-3.1-flash-lite` và dự phòng `moonshotai/kimi-k2.6`, **tắt suy luận**. So sánh model khác hoặc bật suy luận:

```bash
yarn ai:golden --models google/gemini-2.5-flash,openai/gpt-4.1-mini --reasoning
```

Ảnh phải được **che định danh** (họ tên, SĐT, địa chỉ, mã BN, số BHYT, mã vạch) trước khi chạy — Tech Spec §5.2. Có thể đặt bản đã che vào thư mục con rồi truyền đường dẫn: `yarn ai:golden fixtures/golden/redacted`.

Lệnh **gọi API thật và phát sinh chi phí** (lấy đúng số USD OpenRouter báo trong `usage.cost`). Báo cáo Markdown được in ra và lưu ở `reports/`; mã thoát 1 khi không model nào đạt ngưỡng 70% (R1).

## Quy tắc chấm điểm

- Mỗi trường lá là 1 điểm: `type`, các trường đầu phiếu và từng trường của mỗi dòng thuốc/xét nghiệm (ghép theo thứ tự).
- **Không chấm `note`** (câu cách dùng nguyên văn): model vẫn trích nhưng trường này không tính vào tỷ lệ đúng.
- So khớp sau chuẩn hóa: bỏ khoảng trắng thừa, không phân biệt hoa/thường, **giữ dấu tiếng Việt**; số so theo giá trị; `slots` so như tập hợp; `null` đúng là đúng.
- Dòng bị bỏ sót hay bịa thêm đều tính sai (mẫu số là hợp trường của đáp án và kết quả).
- Phản hồi lỗi, không phải JSON hoặc sai schema → cả ảnh 0 điểm.
- Tỷ lệ đúng = tổng trường đúng / tổng trường trên toàn bộ ảnh.
