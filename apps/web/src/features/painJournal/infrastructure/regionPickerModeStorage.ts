export type RegionPickerMode = 'image' | 'list' | '3d';
type ModeStorage = Pick<Storage, 'getItem' | 'setItem'> | null;

const KEY = 'angia.painRegionPickerMode';

// SPEC-058: chế độ chọn vùng chỉ là tùy chọn giao diện theo thiết bị, không gửi lên server.
function browserStorage(): ModeStorage {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRegionPickerMode(
  supportsWebGL: boolean,
  storage: ModeStorage = browserStorage(),
): RegionPickerMode {
  let stored: string | null = null;
  try {
    stored = storage?.getItem(KEY) ?? null;
  } catch {
    // Lưu trữ bị chặn thì dùng mặc định "Hình".
  }
  if (stored === 'list' || (stored === '3d' && supportsWebGL)) return stored;
  return 'image';
}

export function saveRegionPickerMode(mode: RegionPickerMode, storage: ModeStorage = browserStorage()): void {
  try {
    storage?.setItem(KEY, mode);
  } catch {
    // Không lưu được thì lần sau mở "Hình"; không ảnh hưởng chọn vùng.
  }
}
