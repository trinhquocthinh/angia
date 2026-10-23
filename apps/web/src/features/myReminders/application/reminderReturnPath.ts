// SPEC-035: chỉ nhớ đường dẫn lời nhắc cùng origin để quay lại sau đăng nhập; không nhận return URL từ query.
const REMINDER_PATH = /^\/reminders\/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const KEY = 'angia.returnTo';

type ReturnStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function isReminderPath(path: string): boolean {
  return REMINDER_PATH.test(path);
}

// Truy cập sessionStorage có thể ném (chế độ riêng tư, bị chặn) hoặc không tồn tại (SSR/test).
function sessionStore(): ReturnStorage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function saveReminderReturnPath(
  path: string,
  storage: ReturnStorage | undefined = sessionStore(),
): void {
  if (!isReminderPath(path)) return;
  try {
    storage?.setItem(KEY, path);
  } catch {
    /* Không lưu được thì sau đăng nhập về trang chủ. */
  }
}

// Đọc một lần rồi xóa; kiểm lại mẫu vì giá trị trong storage có thể bị sửa.
export function takeReminderReturnPath(storage: ReturnStorage | undefined = sessionStore()): string | null {
  try {
    const path = storage?.getItem(KEY) ?? null;
    storage?.removeItem(KEY);
    return path !== null && isReminderPath(path) ? path : null;
  } catch {
    return null;
  }
}
