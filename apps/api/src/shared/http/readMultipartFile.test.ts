import { readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { readMultipartFile } from './readMultipartFile.js';

const limits = { fieldName: 'image', maxFileBytes: 1000, maxBodyBytes: 2000 };
const filled = (size: number, value = 7) => new Uint8Array(size).fill(value);
// Mã hoá sẵn thành byte: huỷ giữa chừng một body FormData của undici sinh unhandled rejection trong test,
// còn body thật đến từ socket HTTP.
const multipart = async (parts: { field: string; bytes: Uint8Array }[]) => {
  const form = new FormData();
  for (const part of parts) form.append(part.field, new File([part.bytes], 'a.jpg'));
  const encoded = new Response(form);
  return new Request('http://test/suggest', {
    method: 'POST',
    body: await encoded.arrayBuffer(),
    headers: { 'content-type': encoded.headers.get('content-type')! },
  });
};

describe('Đọc một tệp multipart vào bộ nhớ (SPEC-083: ảnh chưa che không ghi ra đĩa)', () => {
  it('trả đúng byte của trường cần đọc và không tạo thư mục tạm nào', async () => {
    const before = await readdir(tmpdir());
    const result = await readMultipartFile(
      await multipart([{ field: 'image', bytes: filled(1000, 3) }]),
      limits,
    );
    expect(result).toEqual({ ok: true, bytes: filled(1000, 3) });
    expect(await readdir(tmpdir())).toEqual(before);
  });

  it('tệp vượt trần, thiếu trường hoặc có hơn một tệp → ERR_VALIDATION', async () => {
    const cases = [
      await multipart([{ field: 'image', bytes: filled(1001) }]),
      await multipart([{ field: 'other', bytes: filled(10) }]),
      await multipart([
        { field: 'image', bytes: filled(10) },
        { field: 'image', bytes: filled(10) },
      ]),
      new Request('http://test/suggest', {
        method: 'POST',
        body: 'x',
        headers: { 'content-type': 'text/plain' },
      }),
    ];
    for (const request of cases)
      expect(await readMultipartFile(request, limits)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });

  it('body khai báo vượt trần bị từ chối trước khi đọc', async () => {
    const big = new Request('http://test/suggest', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=x', 'content-length': '5000' },
      body: 'không đọc tới',
    });
    expect(await readMultipartFile(big, limits)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });
});
