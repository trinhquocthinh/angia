import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeHeicToJpeg } from './decodeHeicToJpeg.js';

const mocks = vi.hoisted(() => ({
  all: vi.fn(),
  decode: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('heic-decode', () => ({
  default: Object.assign(
    vi.fn(async () => ({
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    })),
    { all: mocks.all },
  ),
}));

function metadata(width: number, height: number, count = 1) {
  return Object.assign(
    Array.from({ length: count }, () => ({
      width,
      height,
      decode: mocks.decode,
    })),
    { dispose: mocks.dispose },
  );
}

beforeEach(() => vi.resetAllMocks());

describe('Giới hạn HEIC trước cấp phát RGBA (F04)', () => {
  it.each([
    [6048, 8064],
    [4000, 6000],
    [3250, 4001],
    [0, 4000],
    [NaN, 4000],
  ])('TC-121: kích thước %s×%s bị chặn trước decode và giải phóng metadata', async (width, height) => {
    mocks.all.mockResolvedValue(metadata(width, height));
    await expect(decodeHeicToJpeg(new Uint8Array([1]))).rejects.toThrow('image_unusable');
    expect(mocks.decode).not.toHaveBeenCalled();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('TC-122: nhiều ảnh top-level bị chặn trước decode', async () => {
    mocks.all.mockResolvedValue(metadata(3024, 4032, 2));
    await expect(decodeHeicToJpeg(new Uint8Array([1]))).rejects.toThrow('image_unusable');
    expect(mocks.decode).not.toHaveBeenCalled();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('TC-123: quá 10 MiB bị chặn trước đọc metadata', async () => {
    await expect(decodeHeicToJpeg(new Uint8Array(10 * 1024 * 1024 + 1))).rejects.toThrow('image_unusable');
    expect(mocks.all).not.toHaveBeenCalled();
  });

  it('TC-124: đúng biên 13 triệu pixel được đi vào decode; lỗi decode được chuẩn hóa', async () => {
    mocks.all.mockResolvedValue(metadata(3250, 4000));
    mocks.decode.mockRejectedValue(new Error('nội dung nhạy cảm'));
    await expect(decodeHeicToJpeg(new Uint8Array([1]))).rejects.toThrow('image_unusable');
    expect(mocks.decode).toHaveBeenCalledOnce();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
});

it('TC-126: ảnh hợp lệ được mã hóa JPEG và metadata được giải phóng', async () => {
  mocks.all.mockResolvedValue(metadata(2, 2));
  mocks.decode.mockResolvedValue({
    width: 2,
    height: 2,
    data: new Uint8ClampedArray(16),
  });
  const jpeg = await decodeHeicToJpeg(new Uint8Array([1]));
  expect([...jpeg.slice(0, 2)]).toEqual([0xff, 0xd8]);
  expect(mocks.dispose).toHaveBeenCalledOnce();
});

it('TC-127: metadata lỗi trả lý do cố định thay vì lỗi decoder', async () => {
  mocks.all.mockRejectedValue(new Error('định danh nhạy cảm'));
  await expect(decodeHeicToJpeg(new Uint8Array([1]))).rejects.toThrow('image_unusable');
  expect(mocks.decode).not.toHaveBeenCalled();
});
