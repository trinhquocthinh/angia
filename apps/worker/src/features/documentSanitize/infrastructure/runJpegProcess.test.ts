import { expect, it } from 'vitest';
import { runJpegProcess } from './runJpegProcess.js';
const bytes = new Uint8Array([1, 2]);

it('TC-417: child phân biệt ảnh hỏng với lỗi hạ tầng, timeout và giới hạn output', async () => {
  await expect(runJpegProcess(bytes, ['-e', 'process.exit(2)'])).rejects.toThrow('image_unusable');
  await expect(runJpegProcess(bytes, ['-e', 'process.exit(1)'])).rejects.toThrow('image_child_failed');
  await expect(runJpegProcess(bytes, ['-e', 'setInterval(()=>{},1000)'], 100)).rejects.toThrow(
    'image_unusable',
  );
  await expect(
    runJpegProcess(bytes, ['-e', 'process.stdout.write(Buffer.alloc(100))'], 3000, 10),
  ).rejects.toThrow('image_unusable');
  await expect(runJpegProcess(bytes, ['-e', 'process.kill(process.pid,"SIGKILL")'])).rejects.toThrow(
    'image_child_failed',
  );
});

it('TC-415: child trả byte sau close và không nhận secret từ worker', async () => {
  expect([...(await runJpegProcess(bytes, ['-e', 'process.stdin.pipe(process.stdout)']))]).toEqual([1, 2]);
  const output = await runJpegProcess(bytes, [
    '-e',
    'process.stdout.write(JSON.stringify(["DATABASE_URL","S3_SECRET_ACCESS_KEY","OPENROUTER_API_KEY"].map(k=>k in process.env)))',
  ]);
  expect(JSON.parse(Buffer.from(output).toString())).toEqual([false, false, false]);
});
