import { describe, expect, it } from 'vitest';
import { privacyPoint } from './privacyPoint';
import { privacyDragRectangle } from './privacyDragRectangle';
import { privacyRectangleInput } from './privacyRectangleInput';

describe('Hình học vùng cắt và che', () => {
  it('TC-200: quy đổi đúng điểm trên hộp ảnh, không dùng kích thước khung ngoài', () => {
    expect(privacyPoint(150, 80, { left: 50, top: 30, width: 200, height: 100 })).toEqual({
      x: 500000,
      y: 500000,
    });
  });
  it('TC-201: kéo ra ngoài ảnh được chặn ở biên và làm tròn số nguyên', () => {
    expect(privacyPoint(-20, 200, { left: 0, top: 0, width: 3, height: 3 })).toEqual({ x: 0, y: 1000000 });
  });
  it('TC-202: kéo ngược vẫn tạo hình chữ nhật đúng, bỏ thao tác không có diện tích', () => {
    expect(privacyDragRectangle({ x: 900000, y: 800000 }, { x: 200000, y: 300000 })).toEqual({
      left: 200000,
      top: 300000,
      width: 700000,
      height: 500000,
    });
    expect(privacyDragRectangle({ x: 1, y: 1 }, { x: 1, y: 1 })).toBeNull();
  });
  it('TC-203: ô số không tạo chiều dài âm hoặc vượt ảnh', () => {
    const rect = { left: 800000, top: 0, width: 200000, height: 1000000 };
    expect(privacyRectangleInput(rect, 'width', '60', 'crop')).toBeNull();
    expect(privacyRectangleInput(rect, 'left', '99', 'crop')).toMatchObject({ left: 990000, width: 10000 });
    expect(privacyRectangleInput(rect, 'height', '0', 'crop')).toBeNull();
    expect(privacyRectangleInput(rect, 'top', 'NaN', 'crop')).toBeNull();
  });
});
