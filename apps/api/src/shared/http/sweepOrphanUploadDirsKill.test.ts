import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sweepOrphanUploadDirs } from './sweepOrphanUploadDirs.js';

const spoolModule = fileURLToPath(new URL('./spoolMultipartFiles.ts', import.meta.url));
// Tiến trình con nhận một lô có tệp đang ghi dở và body không bao giờ kết thúc.
const childScript = `
import { spoolMultipartFiles } from ${JSON.stringify(spoolModule)};
const boundary = 'b';
const body = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(
      '--b\\r\\nContent-Disposition: form-data; name="files"; filename="a.jpg"\\r\\n\\r\\n' + 'x'.repeat(4096),
    ));
  },
});
const request = new Request('http://test/upload', {
  method: 'POST', body, duplex: 'half',
  headers: { 'content-type': 'multipart/form-data; boundary=' + boundary },
});
setInterval(() => undefined, 1000);
void spoolMultipartFiles(request, { fieldName: 'files', maxFiles: 3, maxFileBytes: 100000, maxBodyBytes: 1000000 });
`;

describe('Tệp tạm còn lại sau khi tiến trình API bị kill (F08b, nợ #21)', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'angia-kill-tests-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('TC-311: SIGKILL giữa request để lại thư mục 0700/tệp 0600; lần khởi động sau quét xóa khi quá ân hạn', async () => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', childScript], {
      env: { ...process.env, TMPDIR: root, TMP: root, TEMP: root },
      stdio: 'ignore',
    });
    const dir = await waitForSpooledFile(root);
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGKILL');
    await exited;

    expect((await stat(dir)).mode & 0o777).toBe(0o700);
    expect((await stat(join(dir, '0'))).mode & 0o777).toBe(0o600);
    const graceMs = 15 * 60_000;
    const uid = process.getuid!();
    expect(await sweepOrphanUploadDirs({ root, graceMs, now: () => new Date(), uid })).toEqual({
      removed: 0,
      failed: 0,
    });
    const later = () => new Date(Date.now() + graceMs + 1000);
    expect(await sweepOrphanUploadDirs({ root, graceMs, now: later, uid })).toEqual({
      removed: 1,
      failed: 0,
    });
    expect(existsSync(dir)).toBe(false);
  }, 20_000);
});

async function waitForSpooledFile(root: string): Promise<string> {
  for (let attempt = 0; attempt < 150; attempt++) {
    const [name] = (await readdir(root)).filter((entry) => entry.startsWith('angia-upload-'));
    if (name && existsSync(join(root, name, '0'))) return join(root, name);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Tiến trình con chưa ghi tệp tạm');
}
