import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadHeicSet } from './loadHeicSet.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'heic-spike-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadHeicSet', () => {
  it('chỉ nhận tệp .heic/.heif (không phân biệt hoa thường), sắp theo tên', async () => {
    await writeFile(join(dir, 'iphone-02.HEIC'), 'bb');
    await writeFile(join(dir, 'iphone-01.heic'), 'a');
    await writeFile(join(dir, 'iphone-03.heif'), 'ccc');
    await writeFile(join(dir, 'anh-thuong.jpg'), 'jpg');
    await writeFile(join(dir, 'README.md'), '#');

    const cases = await loadHeicSet(dir);

    expect(cases).toEqual([
      { caseId: 'iphone-01', path: join(dir, 'iphone-01.heic'), bytes: 1 },
      { caseId: 'iphone-02', path: join(dir, 'iphone-02.HEIC'), bytes: 2 },
      { caseId: 'iphone-03', path: join(dir, 'iphone-03.heif'), bytes: 3 },
    ]);
  });

  it('báo lỗi khi thư mục không có ảnh HEIC nào', async () => {
    await writeFile(join(dir, 'anh.jpg'), 'jpg');

    await expect(loadHeicSet(dir)).rejects.toThrow(/không có ảnh HEIC/);
  });
});
