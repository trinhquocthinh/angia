import { describe, expect, it } from 'vitest';
import { clampScale, fitScale, imageBox, zoomAt } from './imageViewport';

const portrait = { width: 1000, height: 2000 };

describe('Khung xem ảnh chứng từ — phóng to, xoay, cuộn', () => {
  it('tỉ lệ 1 = vừa chiều ngang khung; ảnh dọc cao gấp đôi bề ngang', () => {
    expect(imageBox(400, 1, portrait, 0)).toEqual({
      width: 400,
      height: 800,
      imageWidth: 400,
      imageHeight: 800,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('xoay 90° đổi chiều khung; ảnh giữ kích thước gốc rồi xoay quanh tâm', () => {
    expect(imageBox(400, 1, portrait, 1)).toEqual({
      width: 400,
      height: 200,
      imageWidth: 200,
      imageHeight: 400,
      offsetX: 100,
      offsetY: -100,
    });
  });

  it('vừa khung: thu nhỏ để thấy trọn ảnh, không phóng quá bề ngang', () => {
    expect(fitScale({ width: 400, height: 600 }, portrait, 0)).toBe(0.75);
    expect(fitScale({ width: 400, height: 600 }, portrait, 1)).toBe(1);
  });

  it('giới hạn tỉ lệ trong [mức nhỏ nhất, 4]', () => {
    expect(clampScale(10, 0.5)).toBe(4);
    expect(clampScale(0.1, 0.5)).toBe(0.5);
    expect(clampScale(2, 0.5)).toBe(2);
  });

  it('phóng to giữ nguyên điểm đang chỉ vào trên ảnh', () => {
    // Điểm (100, 50) trong khung, đang cuộn (20, 30): điểm ảnh (120, 80) → gấp đôi (240, 160).
    expect(zoomAt({ left: 20, top: 30 }, { x: 100, y: 50 }, 1, 2)).toEqual({ left: 140, top: 110 });
  });
});
