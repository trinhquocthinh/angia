import { describe, expect, it, vi } from 'vitest';
import type { Quad, RgbaImage } from '../application/scanTypes';
import { createDocumentScanner } from './createDocumentScanner';

const image = (): RgbaImage => ({ width: 4, height: 2, data: new Uint8ClampedArray(32).fill(200) });
const full: Quad = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 2 },
  { x: 0, y: 2 },
];

describe('Bộ nắn giấy (SPEC-084)', () => {
  it('không có Worker thì tính trên luồng chính', async () => {
    const out = await createDocumentScanner(() => null).process(image(), full, false);
    expect([out.width, out.height]).toEqual([4, 2]);
  });

  it('gửi việc sang worker kèm chuyển giao buffer, nhận kết quả rồi huỷ worker; lỗi thì từ chối', async () => {
    const result: RgbaImage = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
    const make = (reply: { ok: boolean; image?: RgbaImage }) => {
      const worker = {
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null,
        terminate: vi.fn(),
        postMessage: vi.fn(() => queueMicrotask(() => worker.onmessage?.({ data: reply } as MessageEvent))),
      };
      return worker;
    };
    const ok = make({ ok: true, image: result });
    const source = image();
    expect(await createDocumentScanner(() => ok).process(source, full, true)).toBe(result);
    expect(ok.postMessage).toHaveBeenCalledWith({ image: source, quad: full, clean: true }, [
      source.data.buffer,
    ]);
    expect(ok.terminate).toHaveBeenCalledOnce();
    const failed = make({ ok: false });
    await expect(createDocumentScanner(() => failed).process(image(), full, true)).rejects.toThrow();
    expect(failed.terminate).toHaveBeenCalledOnce();
  });
});
