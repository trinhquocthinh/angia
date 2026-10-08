import { describe, expect, it } from 'vitest';
import { runHeicProcess } from './runHeicProcess.js';

const input = new Uint8Array([1, 2, 3]);
const script = (code: string) => ['-e', code];

describe('Cô lập chuyển đổi HEIC trong tiến trình con', () => {
  it('TC-128: nhận byte kết quả khi tiến trình đóng thành công', async () => {
    const output = await runHeicProcess(input, script('process.stdin.pipe(process.stdout)'));
    expect([...output]).toEqual([1, 2, 3]);
  });
  it('TC-129: quá timeout → chấm dứt tiến trình con rồi trả lỗi cố định', async () => {
    await expect(runHeicProcess(input, script('setInterval(()=>{},1000)'), 100)).rejects.toThrow(
      'image_unusable',
    );
  });
  it('TC-130: exit lỗi dù đã ghi output → không nhận kết quả', async () => {
    await expect(
      runHeicProcess(input, script('process.stdout.write("x");process.exitCode=1')),
    ).rejects.toThrow('image_unusable');
  });
  it('TC-131: output quá giới hạn → chấm dứt và không nhận kết quả', async () => {
    await expect(
      runHeicProcess(input, script('process.stdout.write(Buffer.alloc(10000))'), 3000, 100),
    ).rejects.toThrow('image_unusable');
  });
  it('TC-132: tiến trình bị signal hoặc output rỗng → không nhận kết quả', async () => {
    for (const code of ['process.kill(process.pid,"SIGKILL")', 'process.exit(0)']) {
      await expect(runHeicProcess(input, script(code))).rejects.toThrow('image_unusable');
    }
  });
});

it('TC-135: tiến trình con không nhận biến môi trường bí mật của worker', async () => {
  const output = await runHeicProcess(
    input,
    script(
      'process.stdout.write(JSON.stringify(["DATABASE_URL","S3_SECRET_ACCESS_KEY","OPENROUTER_API_KEY"].map(key=>key in process.env)))',
    ),
  );
  expect(JSON.parse(Buffer.from(output).toString())).toEqual([false, false, false]);
});

it('TC-136: promise timeout chỉ kết thúc sau khi PID con không còn tồn tại', async () => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'angia-heic-pid-'));
  try {
    const path = join(dir, 'pid');
    const code = `require('node:fs').writeFileSync(${JSON.stringify(path)},String(process.pid));setInterval(()=>{},1000)`;
    await expect(runHeicProcess(input, script(code), 1000)).rejects.toThrow('image_unusable');
    const pid = Number(await readFile(path, 'utf8'));
    expect(() => process.kill(pid, 0)).toThrow();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
