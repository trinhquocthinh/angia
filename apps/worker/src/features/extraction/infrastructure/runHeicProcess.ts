import { spawn } from 'node:child_process';
import { ImageConversionError } from '../application/ImageConversionError.js';

// Chỉ nhận kết quả sau close; timeout không giải phóng slot khi tiến trình con còn chạy.
export function runHeicProcess(
  bytes: Uint8Array,
  args: string[],
  timeoutMs = 30_000,
  maxOutputBytes = 16 * 1024 * 1024,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: ['pipe', 'pipe', 'ignore'],
      shell: false,
      env: { PATH: process.env.PATH ?? '', NODE_ENV: process.env.NODE_ENV ?? 'production' },
    });
    const chunks: Buffer[] = [];
    let outputBytes = 0;
    let failed = false;
    const stop = () => {
      failed = true;
      child.kill('SIGKILL');
    };
    const timer = setTimeout(stop, timeoutMs);
    child.on('error', stop);
    child.stdin.on('error', stop);
    child.stdout.on('error', stop);
    child.stdout.on('data', (chunk: Buffer) => {
      if (failed) return;
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) return stop();
      chunks.push(chunk);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (failed || code !== 0 || signal || outputBytes === 0) return reject(new ImageConversionError());
      resolve(Buffer.concat(chunks, outputBytes));
    });
    child.stdin.end(bytes);
  });
}
