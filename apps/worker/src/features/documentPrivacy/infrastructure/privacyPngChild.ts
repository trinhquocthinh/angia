import { renderPrivacyPng } from './renderPrivacyPng.js';
async function main(): Promise<void> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk as Uint8Array);
    size += bytes.byteLength;
    if (size > 10 * 1024 * 1024) throw new Error('image_unusable');
    chunks.push(bytes);
  }
  const edits: unknown = JSON.parse(process.argv[3] ?? 'null');
  const output = await renderPrivacyPng(Buffer.concat(chunks, size), process.argv[2] ?? '', edits);
  await new Promise<void>((resolve, reject) => {
    process.stdout.write(output, (error) => (error ? reject(error) : resolve()));
  });
}
void main().catch(() => {
  process.exitCode = 1;
});
