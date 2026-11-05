import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { encodeSanitizedJpeg } from './encodeSanitizedJpeg.js';

async function main(): Promise<void> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk as Uint8Array);
    size += bytes.length;
    if (size > 10 * 1024 * 1024) throw new ImageConversionError();
    chunks.push(bytes);
  }
  const output = await encodeSanitizedJpeg(Buffer.concat(chunks, size));
  await new Promise<void>((resolve, reject) => {
    process.stdout.write(output.bytes, (error) => (error ? reject(error) : resolve()));
  });
}
void main().catch((error: unknown) => {
  process.exitCode = error instanceof ImageConversionError ? 2 : 1;
});
