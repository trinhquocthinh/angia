import { describe, expect, it } from 'vitest';
import { findLabCatalogEntry } from './findLabCatalogEntry';
import { LAB_CATALOG } from './labCatalog';

describe('findLabCatalogEntry — BR-022 làm rõ 2026-10-25', () => {
  it.each([
    ['Creatinin', 'kidney', 'Chất thải từ cơ bắp, do thận lọc ra'],
    ['AST (GOT)', 'liver', 'Men gan AST'],
    ['Glucose (máu)', 'glucose', 'Lượng đường (glucose) trong máu'],
    ['HbA1c.', 'glucose', 'Đường huyết trung bình khoảng 2–3 tháng gần đây'],
    ['hba1c', 'glucose', 'Đường huyết trung bình khoảng 2–3 tháng gần đây'],
    ['HDL - C', 'lipid', 'Cholesterol gắn HDL'],
    ['Glucose:', 'glucose', 'Lượng đường (glucose) trong máu'],
    ['  creatinin  ', 'kidney', 'Chất thải từ cơ bắp, do thận lọc ra'],
    ['Protein niệu', 'urine', 'Lượng đạm trong nước tiểu'],
    ['NT-proBNP', 'cardiac', 'Chất do tim tiết ra, đo trong máu'],
    ['FT4', 'thyroid', 'Hormone tuyến giáp dạng tự do'],
    ['Natri', 'electrolyte', 'Nồng độ natri trong máu'],
  ])('TC-394 — "%s" thuộc nhóm %s kèm ghi chú trung tính', (name, group, note) => {
    expect(findLabCatalogEntry(name)).toEqual({ group, note });
  });

  it.each(['GLU', 'PRO', 'BLD', 'LEU', 'pH', 'BIL', 'ERY', 'Xét nghiệm X'])(
    'TC-395 — "%s" (mơ hồ hoặc không có trong từ điển) xếp "Khác", không ghi chú',
    (name) => {
      expect(findLabCatalogEntry(name)).toEqual({ group: 'other', note: null });
    },
  );

  it('TC-394 — ghi chú ngắn, không chứa chữ nhận định; alias không trùng giữa các mục', () => {
    const aliases = LAB_CATALOG.flatMap((entry) => entry.aliases);
    expect(new Set(aliases).size).toBe(aliases.length);
    for (const entry of LAB_CATALOG) {
      expect(entry.note.length).toBeLessThanOrEqual(60);
      expect(entry.note).not.toMatch(/tốt|xấu|bình thường|bất thường|cao|thấp|chú ý/i);
    }
  });
});
