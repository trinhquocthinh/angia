type ReminderStorage = Pick<Storage, 'getItem' | 'setItem'> | null;

const KEY = 'angia.uploadPrivacyReminder.dismissed';

// Lựa chọn "Không nhắc lại" chỉ là tiện ích theo thiết bị; lưu trữ bị chặn/lỗi thì cứ hiện popup.
function browserStorage(): ReminderStorage {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function shouldShowPrivacyReminder(storage: ReminderStorage = browserStorage()): boolean {
  try {
    return storage?.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

export function dismissPrivacyReminder(storage: ReminderStorage = browserStorage()): void {
  try {
    storage?.setItem(KEY, '1');
  } catch {
    // Không lưu được thì lần sau hiện lại — an toàn hơn là ẩn.
  }
}
