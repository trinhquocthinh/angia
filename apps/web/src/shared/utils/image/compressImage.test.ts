import { describe, expect, it, vi } from 'vitest';
import { compressImage, type ImageCodec } from './compressImage';

const MB = 1024 * 1024;
const fakeFile = (name: string, type: string, size: number) =>
  ({ name, type, size, lastModified: 0 }) as File;

// Codec giả: dung lượng JPEG tỉ lệ với số điểm ảnh × chất lượng (đủ để kiểm chính sách nén).
function fakeCodec(bytesPerPixelAtFullQuality: number, decodable = true) {
  const encodes: Array<{ width: number; height: number; quality: number }> = [];
  const release = vi.fn();
  const codec: ImageCodec = {
    decode: async () => {
      if (!decodable) throw new Error('không giải mã được');
      return { width: 4032, height: 3024, release };
    },
    encodeJpeg: async (_image, size, quality) => {
      encodes.push({ ...size, quality });
      const bytes = Math.round(size.width * size.height * bytesPerPixelAtFullQuality * quality);
      return new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
    },
  };
  return { codec, encodes, release };
}

describe('Nén ảnh phía máy trạm trước khi tải (E3-S1-T2)', () => {
  it('ảnh JPEG 12 MB nén xuống ≤ 3 MB, cạnh dài ≤ 3000 px, đổi đuôi .jpg', async () => {
    const { codec, encodes, release } = fakeCodec(0.4);
    const result = await compressImage(fakeFile('don-thuoc.png', 'image/png', 12 * MB), codec);
    expect(result.size).toBeLessThanOrEqual(3 * MB);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('don-thuoc.jpg');
    expect(encodes[0]).toEqual({ width: 3000, height: 2250, quality: 0.85 });
    expect(release).toHaveBeenCalledOnce();
  });
  it('vẫn > 3 MB thì hạ dần chất lượng, rồi thu nhỏ thêm tới khi đạt', async () => {
    const { codec, encodes } = fakeCodec(1);
    const result = await compressImage(fakeFile('a.jpg', 'image/jpeg', 12 * MB), codec);
    expect(encodes.map((e) => [Math.max(e.width, e.height), e.quality])).toEqual([
      [3000, 0.85],
      [3000, 0.75],
      [3000, 0.6],
      [2400, 0.6],
    ]);
    expect(result.size).toBeLessThanOrEqual(3 * MB);
  });
  it('ảnh ≤ 3 MB giữ nguyên tệp gốc, không giải mã', async () => {
    const { codec, encodes } = fakeCodec(1);
    const original = fakeFile('a.jpg', 'image/jpeg', 3 * MB);
    expect(await compressImage(original, codec)).toBe(original);
    expect(encodes).toHaveLength(0);
  });
  it('HEIC nhỏ vẫn đổi sang JPEG khi trình duyệt giải mã được', async () => {
    const { codec } = fakeCodec(0.1);
    const result = await compressImage(fakeFile('IMG_1.HEIC', '', 2 * MB), codec);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_1.jpg');
  });
  it('trình duyệt không giải mã được (HEIC trên Chrome) → gửi tệp gốc', async () => {
    const { codec } = fakeCodec(1, false);
    const original = fakeFile('IMG_1.heic', 'image/heic', 2 * MB);
    expect(await compressImage(original, codec)).toBe(original);
  });
  it('lỗi khi mã hóa → giải phóng ảnh đã giải mã và gửi tệp gốc', async () => {
    const release = vi.fn();
    const codec: ImageCodec = {
      decode: async () => ({ width: 10, height: 10, release }),
      encodeJpeg: async () => Promise.reject(new Error('hết bộ nhớ')),
    };
    const original = fakeFile('a.jpg', 'image/jpeg', 5 * MB);
    expect(await compressImage(original, codec)).toBe(original);
    expect(release).toHaveBeenCalledOnce();
  });
});
