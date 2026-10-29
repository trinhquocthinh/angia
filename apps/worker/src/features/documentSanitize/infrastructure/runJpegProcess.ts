import { spawn } from 'node:child_process';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';

export function runJpegProcess(
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
    let size = 0;
    let failure: Error | undefined;
    const stop = (error: Error) => {
      failure ??= error;
      child.kill('SIGKILL');
    };
    const timer = setTimeout(() => stop(new ImageConversionError()), timeoutMs);
    child.on('error', () => stop(new Error('image_child_failed')));
    child.stdin.on('error', () => {
      /* close quyết định lỗi decoder hay lỗi hạ tầng. */
    });
    child.stdout.on('error', () => stop(new Error('image_child_failed')));
    child.stdout.on('data', (chunk: Buffer) => {
      if (failure) return;
      size += chunk.length;
      if (size > maxOutputBytes) return stop(new ImageConversionError());
      chunks.push(chunk);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (failure) return reject(failure);
      if (code === 2) return reject(new ImageConversionError());
      if (code !== 0 || signal || !size) return reject(new Error('image_child_failed'));
      resolve(Buffer.concat(chunks, size));
    });
    child.stdin.end(bytes);
  });
}
