import { describe, expect, it, vi } from 'vitest';
import type { PrivacyEdits } from '@angia/contracts';
import { exportRedactedJpeg } from './exportRedactedJpeg';
import type { RedactionCodec, RedactionPlan } from './redactionPorts';

const MiB = 1024 * 1024;
const FILE = { name: 'don-thuoc.jpg', type: 'image/jpeg' } as File;
const EDITS: PrivacyEdits = {
  rotation: 0,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [{ left: 0, top: 0, width: 100_000, height: 100_000 }],
};

// Codec giả: kích thước đã xoay theo EXIF và dung lượng JPEG theo từng mức chất lượng.
function fakeCodec(sizes: Record<number, number>, decoded = { width: 3024, height: 4032 }) {
  const plans: RedactionPlan[] = [];
  const qualities: number[] = [];
  const release = vi.fn();
  const dispose = vi.fn();
  const codec: RedactionCodec = {
    decode: async () => ({ ...decoded, release }),
    render: async (_image, plan) => {
      plans.push(plan);
      return { width: plan.crop.width, height: plan.crop.height };
    },
    encodeJpeg: async (_rendered, quality) => {
      qualities.push(quality);
      return { size: (sizes[quality] ?? 0) * MiB } as Blob;
    },
    dispose,
  };
  return { codec, plans, qualities, release, dispose };
}

describe('Xuất JPEG đã che trên máy (E11-S3-T1)', () => {
  it('TC-427 plan dùng kích thước sau khi xoay EXIF mà codec trả về (orientation 6 → 3024×4032)', async () => {
    const { codec, plans } = fakeCodec({ 0.92: 1 });
    await exportRedactedJpeg(FILE, EDITS, codec);
    expect(plans[0]?.rotated).toEqual({ width: 3024, height: 4032 });
    expect(plans[0]?.masks[0]).toEqual({ left: 0, top: 0, width: 304, height: 405 });
  });

  it('TC-428 0,92 ra 12 MiB, 0,85 ra 9 MiB → chọn 0,85; giải phóng ảnh và canvas', async () => {
    const { codec, qualities, release, dispose } = fakeCodec({ 0.92: 12, 0.85: 9 });
    const result = await exportRedactedJpeg(FILE, EDITS, codec);
    expect(qualities).toEqual([0.92, 0.85]);
    expect(result).toMatchObject({ ok: true, width: 3024, height: 4032 });
    expect(result.ok && result.blob.size).toBe(9 * MiB);
    expect(release).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('TC-428 mọi mức chất lượng vẫn > 10 MiB → too_large sau khi thử hết thang', async () => {
    const { codec, qualities, dispose } = fakeCodec({ 0.92: 14, 0.85: 13, 0.78: 12, 0.7: 11 });
    expect(await exportRedactedJpeg(FILE, EDITS, codec)).toEqual({ ok: false, problem: 'too_large' });
    expect(qualities).toEqual([0.92, 0.85, 0.78, 0.7]);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('TC-428 đúng 10 MiB vẫn được nhận', async () => {
    const { codec } = fakeCodec({ 0.92: 10 });
    expect((await exportRedactedJpeg(FILE, EDITS, codec)).ok).toBe(true);
  });

  it('TC-428 trình duyệt không giải mã được ảnh → decode_failed', async () => {
    const { codec } = fakeCodec({});
    codec.decode = async () => {
      throw new Error('không giải mã được');
    };
    expect(await exportRedactedJpeg(FILE, EDITS, codec)).toEqual({ ok: false, problem: 'decode_failed' });
  });
});
