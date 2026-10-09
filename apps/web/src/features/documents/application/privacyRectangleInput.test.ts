import { describe, expect, it } from 'vitest';
import { privacyRectangleInput } from './privacyRectangleInput';
const full = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
describe('Nhập tọa độ vùng cắt và che', () => {
  it('TC-220: nhập Trái/Trên khi crop toàn khung vẫn giữ vùng nằm trong ảnh', () => {
    expect(privacyRectangleInput(full, 'left', '10', 'crop')).toEqual({
      ...full,
      left: 100000,
      width: 900000,
    });
    expect(privacyRectangleInput(full, 'top', '25', 'crop')).toEqual({
      ...full,
      top: 250000,
      height: 750000,
    });
  });
  it('TC-221: chấp nhận dấu phẩy/chấm thập phân và làm tròn tọa độ nguyên', () => {
    expect(privacyRectangleInput(full, 'width', '12,34567', 'crop')?.width).toBe(123457);
    expect(privacyRectangleInput(full, 'height', '.5', 'crop')?.height).toBe(5000);
  });
  it('TC-222: chuỗi rỗng, sai định dạng hoặc vượt giới hạn không được commit', () => {
    for (const text of ['', ' ', 'NaN', '1e2', '2abc', '-1', '101'])
      expect(privacyRectangleInput(full, 'width', text, 'crop')).toBeNull();
    expect(privacyRectangleInput(full, 'left', '100', 'crop')).toBeNull();
    expect(privacyRectangleInput(full, 'height', '0', 'crop')).toBeNull();
  });
  it('TC-223: vượt biên vùng che báo lỗi, không tự co vùng đã che', () => {
    const mask = { left: 200000, top: 100000, width: 300000, height: 400000 };
    expect(privacyRectangleInput(mask, 'left', '80', 'mask')).toBeNull();
    expect(privacyRectangleInput(mask, 'top', '70', 'mask')).toBeNull();
    expect(privacyRectangleInput(mask, 'left', '70', 'mask')).toEqual({ ...mask, left: 700000 });
  });
  it('TC-224: tăng chiều dài vượt mép ảnh bị từ chối thay vì âm thầm sửa số', () => {
    const crop = { ...full, left: 100000, width: 900000 };
    expect(privacyRectangleInput(crop, 'width', '95', 'crop')).toBeNull();
    expect(privacyRectangleInput(crop, 'width', '90', 'crop')).toEqual(crop);
  });
});
