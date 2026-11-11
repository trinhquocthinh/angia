import { describe, expect, it, vi } from 'vitest';
import type { RedactionCodec, RedactionPlan } from './redactionPorts';
import type { DocumentScanner } from './scanPorts';
import { scanDocument } from './scanDocument';
import type { Quad, RgbaImage } from './scanTypes';

const FILE = { name: 'don.heic' } as File;
const pixels = (width: number, height: number): RgbaImage => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4),
});

function fakes() {
  const plans: RedactionPlan[] = [];
  const disposed: unknown[] = [];
  const release = vi.fn();
  const codec: RedactionCodec = {
    decode: async () => ({ width: 3000, height: 4000, release }),
    render: async (_image, plan) => {
      plans.push(plan);
      return { width: plan.rotated.width, height: plan.rotated.height };
    },
    readPixels: (rendered) => pixels(rendered.width, rendered.height),
    fromPixels: (image) => ({ width: image.width, height: image.height }),
    encodeJpeg: vi.fn(async () => new Blob(['jpeg'])),
    dispose: (rendered) => void disposed.push(rendered),
  };
  const calls: { quad: Quad; clean: boolean; size: number[] }[] = [];
  const scanner: DocumentScanner = {
    process: async (image, quad, clean) => {
      calls.push({ quad, clean, size: [image.width, image.height] });
      return pixels(100, 200);
    },
  };
  return { codec, scanner, plans, disposed, release, calls };
}

describe('Nắn giấy trên máy (SPEC-084)', () => {
  it('vẽ ảnh đã xoay toàn khung, đổi 4 góc chuẩn hoá sang pixel, mã hoá JPEG 0,92 và giải phóng canvas', async () => {
    const { codec, scanner, plans, disposed, release, calls } = fakes();
    const quad: Quad = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ];
    const blob = await scanDocument({ file: FILE, rotation: 90, quad, clean: true }, codec, scanner);
    expect(blob).toBeInstanceOf(Blob);
    expect(plans[0]).toMatchObject({ rotation: 90, masks: [], rotated: { width: 4000, height: 3000 } });
    expect(calls[0]!.size).toEqual([4000, 3000]);
    expect(calls[0]!.quad[0]).toEqual({ x: 400, y: 300 });
    expect(calls[0]!.quad[2]).toEqual({ x: 3600, y: 2700 });
    expect(calls[0]!.clean).toBe(true);
    expect(codec.encodeJpeg).toHaveBeenCalledWith({ width: 100, height: 200 }, 0.92);
    expect(release).toHaveBeenCalledOnce();
    expect(disposed).toHaveLength(2);
  });
});
