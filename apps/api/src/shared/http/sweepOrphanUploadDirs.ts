import { lstat, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOAD_DIR_PREFIX } from './spoolMultipartFiles.js';

interface SweepOptions {
  root: string;
  /** Thư mục có mtime mới hơn khoảng này có thể thuộc request đang chạy ở tiến trình khác dùng chung `/tmp`. */
  graceMs: number;
  now: () => Date;
  uid: number;
}
interface SweepResult {
  removed: number;
  failed: number;
}

// F08b / nợ #21: dọn ảnh chứng từ còn trong thư mục tạm khi tiến trình API chết giữa request.
// Chỉ xóa thư mục thật (không theo symlink) của chính uid này, quá thời gian ân hạn; lỗi từng mục không chặn khởi động.
export async function sweepOrphanUploadDirs(options: SweepOptions): Promise<SweepResult> {
  const result: SweepResult = { removed: 0, failed: 0 };
  let names: string[];
  try {
    names = (await readdir(options.root)).filter((name) => name.startsWith(UPLOAD_DIR_PREFIX));
  } catch {
    return result;
  }
  const cutoff = options.now().getTime() - options.graceMs;
  for (const name of names) {
    const path = join(options.root, name);
    try {
      const info = await lstat(path);
      if (!info.isDirectory() || info.uid !== options.uid || info.mtimeMs >= cutoff) continue;
      await rm(path, { recursive: true, force: true });
      result.removed++;
    } catch {
      result.failed++;
    }
  }
  return result;
}
