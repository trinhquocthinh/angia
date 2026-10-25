import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sweepOrphanUploadDirs } from './sweepOrphanUploadDirs.js';

const GRACE_MS = 15 * 60_000;
const NOW = new Date('2026-10-19T08:00:00Z');
const OLD = new Date(NOW.getTime() - GRACE_MS - 1000);
const FRESH = new Date(NOW.getTime() - GRACE_MS + 60_000);

describe('Quét thư mục tạm angia-upload-* mồ côi khi API khởi động (F08b, nợ #21)', () => {
  let root: string;
  const uid = process.getuid!();
  const sweep = (options: Partial<Parameters<typeof sweepOrphanUploadDirs>[0]> = {}) =>
    sweepOrphanUploadDirs({ root, graceMs: GRACE_MS, now: () => NOW, uid, ...options });
  const makeDir = async (name: string, mtime: Date) => {
    const dir = join(root, name);
    await mkdir(dir, { mode: 0o700 });
    await writeFile(join(dir, '0'), 'ảnh', { mode: 0o600 });
    await utimes(dir, mtime, mtime);
    return dir;
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'angia-sweep-tests-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('TC-310: xóa thư mục cũ hơn thời gian ân hạn kèm tệp bên trong, giữ thư mục mới (có thể của request đang chạy)', async () => {
    const orphan = await makeDir('angia-upload-old', OLD);
    const active = await makeDir('angia-upload-new', FRESH);

    expect(await sweep()).toEqual({ removed: 1, failed: 0 });
    expect(existsSync(orphan)).toBe(false);
    expect(existsSync(join(active, '0'))).toBe(true);
  });

  it('TC-310: không chạm mục sai tiền tố, tệp thường hay symlink trùng tiền tố', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'angia-sweep-target-'));
    try {
      const other = await makeDir('khac-upload-old', OLD);
      await writeFile(join(root, 'angia-upload-file'), 'x');
      await utimes(join(root, 'angia-upload-file'), OLD, OLD);
      await writeFile(join(outside, 'giu.txt'), 'x');
      await symlink(outside, join(root, 'angia-upload-link'));

      expect(await sweep()).toEqual({ removed: 0, failed: 0 });
      expect(existsSync(other)).toBe(true);
      expect(existsSync(join(root, 'angia-upload-file'))).toBe(true);
      expect(existsSync(join(outside, 'giu.txt'))).toBe(true);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('TC-310: không xóa thư mục của uid khác', async () => {
    const dir = await makeDir('angia-upload-old', OLD);

    expect(await sweep({ uid: uid + 1 })).toEqual({ removed: 0, failed: 0 });
    expect(existsSync(dir)).toBe(true);
  });

  it('TC-310: thư mục gốc không tồn tại thì trả 0, không ném lỗi chặn khởi động', async () => {
    expect(await sweep({ root: join(root, 'khong-co') })).toEqual({ removed: 0, failed: 0 });
  });
});
