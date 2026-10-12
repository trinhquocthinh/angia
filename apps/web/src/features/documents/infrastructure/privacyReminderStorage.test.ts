import { describe, expect, it } from 'vitest';
import { dismissPrivacyReminder, shouldShowPrivacyReminder } from './privacyReminderStorage';

const memory = (): Pick<Storage, 'getItem' | 'setItem'> => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
};
const broken: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('Lưu lựa chọn "Không nhắc lại" của popup tải ảnh (BR-041 bổ sung)', () => {
  it('TC-246: lần đầu hiện popup; chọn không nhắc lại thì lần sau không hiện', () => {
    const storage = memory();
    expect(shouldShowPrivacyReminder(storage)).toBe(true);
    dismissPrivacyReminder(storage);
    expect(shouldShowPrivacyReminder(storage)).toBe(false);
  });

  it('TC-246: trình duyệt chặn lưu trữ → vẫn hiện popup, không ném lỗi', () => {
    expect(shouldShowPrivacyReminder(broken)).toBe(true);
    expect(() => dismissPrivacyReminder(broken)).not.toThrow();
    expect(shouldShowPrivacyReminder(null)).toBe(true);
  });
});
