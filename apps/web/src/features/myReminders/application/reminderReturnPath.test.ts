import { describe, expect, it } from 'vitest';
import { isReminderPath, saveReminderReturnPath, takeReminderReturnPath } from './reminderReturnPath';

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const KEY = 'angia.returnTo';

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(seed));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}
function brokenStorage(): Storage {
  const fail = () => {
    throw new Error('SecurityError');
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe('Quay lại lời nhắc sau đăng nhập (SPEC-035)', () => {
  it('chỉ nhận đường dẫn /reminders/<uuid> cùng origin', () => {
    expect(isReminderPath(`/reminders/${id}`)).toBe(true);
    expect(isReminderPath(`/reminders/${id.toUpperCase()}`)).toBe(true);
    for (const path of [
      `/reminders/${id}?x=1`,
      '//evil.test',
      '/reminders/abc',
      `https://angia.test/reminders/${id}`,
      `/reminders/${id}/`,
      '/',
    ])
      expect(isReminderPath(path)).toBe(false);
  });
  it('SPEC-044: chỉ nhận đường dẫn tái khám hợp lệ và khôi phục một lần', () => {
    const path = `/revisit-reminders/${id}`;
    const storage = memoryStorage();
    expect(isReminderPath(path)).toBe(true);
    saveReminderReturnPath(path, storage);
    expect(takeReminderReturnPath(storage)).toBe(path);
    expect(takeReminderReturnPath(storage)).toBeNull();
    for (const bad of [
      path + '?next=//evil.test',
      path + '/',
      '/revisit-reminders/abc',
      '//evil.test' + path,
      'https://evil.test' + path,
      '/revisit-reminders/' + id.toUpperCase(),
    ])
      expect(isReminderPath(bad)).toBe(false);
  });
  it('lưu đường dẫn hợp lệ rồi lấy ra đúng một lần và xóa khóa', () => {
    const storage = memoryStorage();
    saveReminderReturnPath(`/reminders/${id}`, storage);
    expect(storage.getItem(KEY)).toBe(`/reminders/${id}`);
    expect(takeReminderReturnPath(storage)).toBe(`/reminders/${id}`);
    expect(storage.getItem(KEY)).toBeNull();
    expect(takeReminderReturnPath(storage)).toBeNull();
  });
  it.each([`/reminders/${id}?x=1`, '//evil.test', '/reminders/abc', `https://angia.test/reminders/${id}`])(
    'không lưu đường dẫn ngoài mẫu: %s',
    (path) => {
      const storage = memoryStorage();
      saveReminderReturnPath(path, storage);
      expect(storage.getItem(KEY)).toBeNull();
    },
  );
  it('giá trị giả mạo đặt sẵn trong storage: trả null và xóa', () => {
    const storage = memoryStorage({ [KEY]: 'https://evil.test/reminders/x' });
    expect(takeReminderReturnPath(storage)).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });
  it('storage ném lỗi: không làm vỡ luồng, trả null', () => {
    expect(() => saveReminderReturnPath(`/reminders/${id}`, brokenStorage())).not.toThrow();
    expect(takeReminderReturnPath(brokenStorage())).toBeNull();
  });
  it('môi trường không có sessionStorage: trả null', () => {
    expect(takeReminderReturnPath()).toBeNull();
  });
});
