import { describe, expect, it, vi } from 'vitest';
import { prepareUpload } from './prepareUpload';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const file = (name: string, size: number) => ({ name, type: 'image/jpeg', size }) as File;

describe('Chuẩn bị ảnh trước khi gửi: nén rồi kiểm trần 10 MiB của API', () => {
  it('ảnh 12 MB được nén → gửi bản nén', async () => {
    const compressed = file('a.jpg', 2 * 1024 * 1024);
    const compress = vi.fn(async () => compressed);
    const original = file('a.jpg', 12 * 1024 * 1024);
    expect(await prepareUpload(original, compress)).toEqual({ ok: true, upload: compressed });
    expect(compress).toHaveBeenCalledWith(original);
  });
  it('TC-080: sau xử lý đúng 10 MiB vẫn gửi; 10 MiB + 1 byte (trình duyệt không nén được) bị loại', async () => {
    const keep = async (input: File) => input;
    expect(await prepareUpload(file('a.heic', MAX_UPLOAD_BYTES), keep)).toMatchObject({ ok: true });
    expect(await prepareUpload(file('b.heic', MAX_UPLOAD_BYTES + 1), keep)).toEqual({
      ok: false,
      problem: 'not_compressible',
    });
  });
});
