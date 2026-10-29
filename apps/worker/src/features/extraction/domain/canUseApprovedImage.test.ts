import { describe, expect, it } from 'vitest';
import { canUseApprovedImage, type ImageApproval } from './canUseApprovedImage.js';

const sha256 = 'a'.repeat(64);
const approved = {
  imageKey: 'families/f/profiles/p/documents/d/images/image.jpg',
  imageSha256: sha256,
  privacyApprovedBy: 'main',
  privacyApprovedAt: new Date('2026-10-28T03:00:00Z'),
};

const check = (image: unknown, hash = sha256): boolean =>
  canUseApprovedImage(image as ImageApproval | null, hash);

describe('BR-041: chỉ dùng một ảnh đã đồng ý với hash byte thực tế', () => {
  it('TC-419: đủ ảnh, người/thời điểm đồng ý và hash khớp thì cho phép', () => {
    expect(check(approved)).toBe(true);
  });

  it('TC-419: thiếu bất kỳ dữ liệu ảnh hoặc đồng ý nào thì chặn', () => {
    expect(check(null)).toBe(false);
    for (const field of Object.keys(approved)) {
      expect(check({ ...approved, [field]: null })).toBe(false);
    }
  });

  it('TC-419: hash sai định dạng hoặc lệch byte thì chặn', () => {
    expect(check(approved, 'b'.repeat(64))).toBe(false);
    for (const imageSha256 of ['', 'a', 'A'.repeat(64), 'g'.repeat(64)]) {
      expect(check({ ...approved, imageSha256 }, imageSha256)).toBe(false);
    }
  });

  it('TC-419: khóa rỗng, người đồng ý rỗng hoặc thời điểm không hợp lệ thì chặn', () => {
    for (const imageKey of ['', ' ', ` ${approved.imageKey}`, `${approved.imageKey} `]) {
      expect(check({ ...approved, imageKey })).toBe(false);
    }
    for (const privacyApprovedBy of ['', ' ']) {
      expect(check({ ...approved, privacyApprovedBy })).toBe(false);
    }
    expect(check({ ...approved, privacyApprovedAt: new Date('invalid') })).toBe(false);
  });
});
