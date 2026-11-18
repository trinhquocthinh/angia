import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'vitest';

const require = createRequire(import.meta.url);
const { glob } = require('node-gyp/lib/find-build-files.js') as {
  glob: (pattern: string, options: { cwd: string }) => Promise<string[]>;
};
const roots: string[] = [];

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'angia-native-build-'));
  roots.push(root);
  await mkdir(join(root, 'build'));
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Bộ tìm tệp build native không dùng picomatch', () => {
  it('chỉ chọn tệp sln, không chọn thư mục, tệp ẩn hoặc tệp lồng', async () => {
    const cwd = await fixture();
    await writeFile(join(cwd, 'build', 'project.sln'), 'fixture');
    await writeFile(join(cwd, 'build', '.hidden.sln'), 'fixture');
    await mkdir(join(cwd, 'build', 'directory.sln'));
    await mkdir(join(cwd, 'build', 'nested'));
    await writeFile(join(cwd, 'build', 'nested', 'ignored.sln'), 'fixture');
    assert.deepEqual(await glob('build/*.sln', { cwd }), ['build/project.sln']);
  });

  it('giữ symlink tới tệp, bỏ symlink hỏng và symlink tới thư mục', async () => {
    const cwd = await fixture();
    await writeFile(join(cwd, 'build', 'project.sln'), 'fixture');
    await mkdir(join(cwd, 'build', 'folder'));
    await symlink('project.sln', join(cwd, 'build', 'linked.sln'));
    await symlink('missing', join(cwd, 'build', 'broken.sln'));
    await symlink('folder', join(cwd, 'build', 'directory.sln'));
    assert.deepEqual(await glob('build/*.sln', { cwd }), ['build/linked.sln', 'build/project.sln']);
  });

  it('giữ đường fallback mk và tên tệp có dấu', async () => {
    const cwd = await fixture();
    await writeFile(join(cwd, 'build', 'khác.mk'), 'fixture');
    await mkdir(join(cwd, 'build', 'directory.mk'));
    assert.deepEqual(await glob('build/*.mk', { cwd }), ['build/khác.mk']);
  });

  it('trả danh sách rỗng khi chưa có thư mục build', async () => {
    const cwd = await fixture();
    await rm(join(cwd, 'build'), { recursive: true });
    assert.deepEqual(await glob('build/*.sln', { cwd }), []);
  });

  it('từ chối mẫu ngoài hai mẫu cố định của node-gyp', async () => {
    const cwd = await fixture();
    await assert.rejects(glob('+(*a)', { cwd }), /Unsupported node-gyp build-file pattern/);
  });
});
