/**
 * Prompt trích xuất dùng chung cho mọi model. Chỉ mô tả cấu trúc SDD §2.1 — tuyệt đối không
 * yêu cầu họ tên/mã bệnh nhân và không đưa lời khuyên hay đánh giá y khoa (BR-033).
 */
export const EXTRACTION_PROMPT = `Bạn là bộ trích xuất dữ liệu từ ảnh chứng từ y tế tiếng Việt.
Xác định ảnh thuộc đúng MỘT trong 3 loại và trả về DUY NHẤT một đối tượng JSON (không markdown, không giải thích):

1) Đơn thuốc — "prescription":
{"type":"prescription","issuedDate":"YYYY-MM-DD"|null,"facility":string|null,"items":[{"name":string,"strength":string|null,"quantityPerDose":number|null,"doseUnit":string|null,"slots":["morning"|"noon"|"afternoon"|"evening"],"durationDays":number|null,"longTerm":boolean,"note":string|null}]}

2) Phiếu kết quả xét nghiệm — "lab_result":
{"type":"lab_result","resultDate":"YYYY-MM-DD"|null,"facility":string|null,"items":[{"testName":string,"value":string|null,"unit":string|null,"referenceRange":string|null}]}

3) Màn hình máy đo tại nhà — "device_reading":
{"type":"device_reading","measuredAt":"YYYY-MM-DD"|null,"measuredTime":"HH:mm"|null,"kind":"blood_pressure"|"glucose","systolic":number|null,"diastolic":number|null,"pulse":number|null,"glucoseValue":number|null,"glucoseUnit":"mmol/L"|"mg/dL"|null}

Quy tắc bắt buộc:
- Chỉ ghi những gì in rõ trên ảnh. Thông tin không có trên ảnh thì gán null; không được suy đoán, không tự điền mặc định.
- Giữ nguyên chính tả tiếng Việt có dấu như trên chứng từ (tên thuốc, đơn vị, tên cơ sở y tế).
- "facility": tên bệnh viện/phòng khám, không kèm khoa, phòng hay cơ quan chủ quản.
- "name": tên thuốc đứng đầu dòng, bỏ hàm lượng có đơn vị (mg, g, ml, %), bỏ ký hiệu trong ngoặc vuông như [KDNT] và bỏ phần trong ngoặc tròn. Thuốc phối hợp ghi các tên nối bằng " + ".
- "strength": hàm lượng/nồng độ in ngay sau tên thuốc, giữ nguyên cách viết; không có thì null.
- "slots": chỉ các buổi được ghi đích danh — sáng → "morning", trưa → "noon", chiều → "afternoon", tối → "evening". Đơn chỉ ghi "ngày N lần" mà không nêu buổi thì để mảng rỗng [].
- "quantityPerDose": số lượng cho MỘT lần dùng khi đơn ghi trực tiếp (ví dụ "mỗi lần 1 viên", "Sáng: 1", "uống tối 1 viên", "1/2 viên" → 0.5). Đơn chỉ ghi tổng trong ngày ("ngày 2 viên chia 2 lần") thì null, không tự chia.
- "doseUnit": đơn vị của liều trong câu cách dùng (viên, gói, ống, ml...), viết thường; câu cách dùng không có đơn vị thì lấy đơn vị ở cột số lượng.
- "durationDays": chỉ khi đơn ghi rõ một số ngày ("x 10 ngày", "trong 5 ngày"); khoảng ("7-10 ngày") hoặc nhiều giai đoạn thì null. Không tự tính từ tổng số lượng.
- "note": câu cách dùng nguyên văn như in trên đơn; không có thì null.
- "longTerm": true chỉ khi đơn ghi rõ dùng dài hạn/lâu dài; ngược lại false.
- "testName": tên chỉ số xét nghiệm giữ nguyên như in trên phiếu, kể cả phần trong ngoặc (ví dụ "WBC (Bạch cầu)"); dòng tiêu đề nhóm (HUYẾT HỌC, SINH HÓA...) không phải chỉ số.
- "value" của xét nghiệm giữ nguyên dạng chuỗi như in trên phiếu (kể cả dấu < hoặc >) nhưng bỏ cờ H/L hay ký hiệu tăng/giảm đi kèm (ví dụ "36.6 L" → "36.6").
- "unit": chỉ lấy từ cột đơn vị của phiếu; phiếu không có cột đơn vị thì null, không tách đơn vị từ khoảng tham chiếu.
- "referenceRange": khoảng tham chiếu như in trên phiếu, bỏ cặp ngoặc bao ngoài, giữ đơn vị nếu đơn vị in trong khoảng (ví dụ "(4 - 10 K/uL)" → "4 - 10 K/uL").
- Ngày chuyển về dạng YYYY-MM-DD; giờ về dạng HH:mm (24 giờ).
- Không trích họ tên, tuổi, địa chỉ hay mã số của người bệnh.
- Không thêm nhận xét, đánh giá hay lời khuyên nào về kết quả.`;
