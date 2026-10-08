import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPrivacyPng } from './hashPrivacyPng.js';
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);
const stream = (chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  });
describe('Hash PNG có giới hạn', () => {
  it('TC-165: hash byte cuối cùng khi signature trải qua nhiều chunk', async () =>
    expect(await hashPrivacyPng(stream([png.slice(0, 3), png.slice(3)]))).toBe(
      createHash('sha256').update(png).digest('hex'),
    ));
  it('TC-166: chặn signature sai và output trên 10 MiB', async () => {
    expect(await hashPrivacyPng(stream([new Uint8Array([1, 2, 3])]))).toBeNull();
    expect(await hashPrivacyPng(stream([png, new Uint8Array(10 * 1024 * 1024)]))).toBeNull();
  });
});
