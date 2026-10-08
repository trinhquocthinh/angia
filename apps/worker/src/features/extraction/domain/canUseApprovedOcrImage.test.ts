import { describe, expect, it } from 'vitest';
import { canUseApprovedOcrImage, type OcrImageApproval } from './canUseApprovedOcrImage.js';

const originalKey = 'families/f/profiles/p/documents/d/original.heic';
const actualSha256 = 'a'.repeat(64);
const approved: OcrImageApproval = {
  ocrImageKey: 'families/f/profiles/p/documents/d/ocr/version-1.jpg',
  ocrImageSha256: actualSha256,
  privacyApprovedBy: '0199bc85-8918-7000-8000-000000000001',
  privacyApprovedAt: new Date('2026-10-08T03:00:00Z'),
};

describe('BR-041: điều kiện sử dụng đúng bản ảnh đã duyệt', () => {
  it('TC-114: cho phép bản ảnh có xác nhận đầy đủ và hash khớp nội dung đã đọc', () => {
    expect(canUseApprovedOcrImage(approved, originalKey, actualSha256)).toBe(true);
  });

  it('TC-114: thiếu bản ảnh hoặc thiếu bất kỳ dữ liệu xác nhận nào thì chặn', () => {
    expect(canUseApprovedOcrImage(null, originalKey, actualSha256)).toBe(false);
    for (const field of [
      'ocrImageKey',
      'ocrImageSha256',
      'privacyApprovedBy',
      'privacyApprovedAt',
    ] as const) {
      expect(canUseApprovedOcrImage({ ...approved, [field]: null }, originalKey, actualSha256)).toBe(false);
    }
  });

  it('TC-115: nội dung đã đổi hoặc hash không hợp lệ không được sử dụng', () => {
    expect(canUseApprovedOcrImage(approved, originalKey, 'b'.repeat(64))).toBe(false);
    expect(canUseApprovedOcrImage({ ...approved, ocrImageSha256: 'a' }, originalKey, 'a')).toBe(false);
  });

  it('TC-115: không cho phép fallback sang ảnh gốc hoặc khóa rỗng', () => {
    for (const ocrImageKey of [originalKey, '', ' ', ` ${approved.ocrImageKey}`]) {
      expect(canUseApprovedOcrImage({ ...approved, ocrImageKey }, originalKey, actualSha256)).toBe(false);
    }
  });

  it('TC-114: xác nhận rỗng hoặc thời điểm không hợp lệ không mở cổng', () => {
    expect(canUseApprovedOcrImage({ ...approved, privacyApprovedBy: '' }, originalKey, actualSha256)).toBe(
      false,
    );
    expect(canUseApprovedOcrImage({ ...approved, privacyApprovedBy: ' ' }, originalKey, actualSha256)).toBe(
      false,
    );
    expect(
      canUseApprovedOcrImage(
        { ...approved, privacyApprovedAt: new Date('invalid') },
        originalKey,
        actualSha256,
      ),
    ).toBe(false);
  });
});
