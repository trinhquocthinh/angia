import { encodeDocumentPreview } from './encodeDocumentPreview.js';

async function main(): Promise<void> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk as Uint8Array);
    size += bytes.length;
    if (size > 10 * 1024 * 1024) throw new Error('image_unusable');
    chunks.push(bytes);
  }
  const output = await encodeDocumentPreview(Buffer.concat(chunks, size), process.argv[2] ?? '');
  await new Promise<void>((resolve, reject) => {
    process.stdout.write(output, (error) => (error ? reject(error) : resolve()));
  });
}
void main().catch(() => {
  process.exitCode = 1;
});
