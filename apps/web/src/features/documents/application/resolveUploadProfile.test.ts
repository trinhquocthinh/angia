import { describe, expect, it } from 'vitest';
import { resolveUploadProfile } from './resolveUploadProfile';

const profile = (id: string, consentStatus: 'confirmed' | 'pending') => ({ id, consentStatus });

describe('Hồ sơ nhận ảnh ở trang Tải lên', () => {
  it('dùng hồ sơ đã chọn nếu đã đồng thuận; chọn hồ sơ chưa đồng thuận thì chưa có hồ sơ', () => {
    const profiles = [profile('a', 'confirmed'), profile('b', 'confirmed'), profile('c', 'pending')];
    expect(resolveUploadProfile(profiles, 'b')?.id).toBe('b');
    expect(resolveUploadProfile(profiles, 'c')).toBeUndefined();
    expect(resolveUploadProfile(profiles, null)).toBeUndefined();
  });

  it('chưa chọn và chỉ có đúng một hồ sơ đã đồng thuận thì tự chọn hồ sơ đó', () => {
    expect(resolveUploadProfile([profile('a', 'confirmed'), profile('c', 'pending')], null)?.id).toBe('a');
    expect(resolveUploadProfile([profile('c', 'pending')], null)).toBeUndefined();
  });
});
