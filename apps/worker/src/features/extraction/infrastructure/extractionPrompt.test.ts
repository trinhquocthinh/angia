import { describe, expect, it } from 'vitest';
import { EXTRACTION_PROMPT } from './extractionPrompt.js';

describe('EXTRACTION_PROMPT', () => {
  it('mô tả đủ 3 loại chứng từ của SDD §2.1', () => {
    for (const type of ['prescription', 'lab_result', 'device_reading'])
      expect(EXTRACTION_PROMPT).toContain(type);
  });

  it('liệt kê đúng tập buổi dùng thuốc hợp lệ', () => {
    for (const slot of ['morning', 'noon', 'afternoon', 'evening'])
      expect(EXTRACTION_PROMPT).toContain(`"${slot}"`);
  });

  it('cấm suy diễn: trường vắng mặt phải là null (BR-016, BR-025)', () => {
    expect(EXTRACTION_PROMPT).toMatch(/null/);
    expect(EXTRACTION_PROMPT).toMatch(/không (được )?suy (đoán|diễn)/i);
  });

  it('quy ước phiếu xét nghiệm: bỏ cờ H/L, đơn vị chỉ lấy từ cột đơn vị, khoảng tham chiếu bỏ ngoặc bao ngoài', () => {
    expect(EXTRACTION_PROMPT).toMatch(/"value".*bỏ cờ/);
    expect(EXTRACTION_PROMPT).toMatch(/"unit".*cột đơn vị/);
    expect(EXTRACTION_PROMPT).toMatch(/"referenceRange".*ngoặc bao ngoài/);
    expect(EXTRACTION_PROMPT).toMatch(/"testName".*giữ nguyên/);
  });

  it('không yêu cầu trích họ tên hay mã bệnh nhân', () => {
    expect(EXTRACTION_PROMPT).not.toMatch(/patientName|họ tên bệnh nhân":/i);
  });
});
