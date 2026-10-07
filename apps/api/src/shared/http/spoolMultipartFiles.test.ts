import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spoolMultipartFiles } from './spoolMultipartFiles.js';

const limits = { fieldName: 'files', maxFiles: 3, maxFileBytes: 1000, maxBodyBytes: 10_000 };
const filled = (size: number, value = 7) => new Uint8Array(size).fill(value);
const multipart = (files: { name: string; bytes: Uint8Array; field?: string }[], fields = {}) => {
  const form = new FormData();
  for (const file of files) form.append(file.field ?? 'files', new File([file.bytes], file.name));
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  return new Request('http://test/upload', { method: 'POST', body: form });
};
const spoolDirs = async () => (await readdir(tmpdir())).filter((name) => name.startsWith('angia-upload-'));

describe('Nhận multipart theo luồng ra đĩa tạm (SPEC-008, E3-S1-T1)', () => {
  it('ghi từng tệp ra đĩa: giữ tên gốc UTF-8, số byte, phần đầu; đọc lại đúng nội dung; dispose xóa thư mục', async () => {
    const before = await spoolDirs();
    const result = await spoolMultipartFiles(
      multipart(
        [
          { name: 'Đơn thuốc mẹ.jpg', bytes: filled(900, 1) },
          { name: 'b.png', bytes: filled(10, 2) },
        ],
        {
          declaredType: 'prescription',
        },
      ),
      limits,
    );
    if (!result.ok) throw new Error(result.code);
    const [first, second] = result.value.files;
    expect(result.value.fields).toEqual({ declaredType: 'prescription' });
    expect(first).toMatchObject({ fileName: 'Đơn thuốc mẹ.jpg', sizeBytes: 900 });
    expect(first!.head.length).toBeLessThanOrEqual(900);
    expect([...first!.head.subarray(0, 4)]).toEqual([1, 1, 1, 1]);
    expect(new Uint8Array(await new Response(first!.open()).arrayBuffer())).toEqual(filled(900, 1));
    expect(second).toMatchObject({ fileName: 'b.png', sizeBytes: 10 });
    expect(await spoolDirs()).toHaveLength(before.length + 1);
    await result.value.dispose();
    expect(await spoolDirs()).toEqual(before);
  });

  it('tệp vượt ngưỡng chỉ ghi tới ngưỡng + 1 byte để báo quá lớn, tệp sau vẫn nhận đủ', async () => {
    const result = await spoolMultipartFiles(
      multipart([
        { name: 'lon.jpg', bytes: filled(5000) },
        { name: 'nho.jpg', bytes: filled(1000) },
      ]),
      limits,
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.value.files.map((f) => [f.fileName, f.sizeBytes])).toEqual([
      ['lon.jpg', 1001],
      ['nho.jpg', 1000],
    ]);
    await result.value.dispose();
  });

  it('bỏ qua trường tệp khác tên, không ghi ra đĩa', async () => {
    const result = await spoolMultipartFiles(
      multipart([
        { name: 'a.jpg', bytes: filled(10) },
        { name: 'x.jpg', bytes: filled(10), field: 'other' },
      ]),
      limits,
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.value.files.map((f) => f.fileName)).toEqual(['a.jpg']);
    await result.value.dispose();
  });

  it.each([
    [
      'TC-023: quá số tệp tối đa',
      multipart([1, 2, 3, 4].map((i) => ({ name: `${i}.jpg`, bytes: filled(10) }))),
    ],
    ['body vượt trần tổng', multipart([1, 2, 3].map((i) => ({ name: `${i}.jpg`, bytes: filled(4000) })))],
  ])('%s → ERR_BATCH_TOO_LARGE, không để lại tệp tạm', async (_name, request) => {
    const before = await spoolDirs();
    expect(await spoolMultipartFiles(request, limits)).toEqual({ ok: false, code: 'ERR_BATCH_TOO_LARGE' });
    expect(await spoolDirs()).toEqual(before);
  });

  it('content-length khai vượt trần → ERR_BATCH_TOO_LARGE trước khi đọc body', async () => {
    const request = new Request('http://test/upload', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=x', 'content-length': '10001' },
      body: 'không đọc tới',
    });
    expect(await spoolMultipartFiles(request, limits)).toEqual({ ok: false, code: 'ERR_BATCH_TOO_LARGE' });
  });

  it.each([
    ['không phải multipart', new Request('http://test', { method: 'POST', body: '{}' })],
    [
      'thiếu boundary',
      new Request('http://test', {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
        body: 'x',
      }),
    ],
    [
      'multipart hỏng',
      new Request('http://test', {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data; boundary=abc' },
        body: '--abc\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\nthiếu kết thúc',
      }),
    ],
    ['không có body', new Request('http://test', { method: 'POST' })],
  ])('%s → ERR_VALIDATION', async (_name, request) => {
    const before = await spoolDirs();
    expect(await spoolMultipartFiles(request, limits)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(await spoolDirs()).toEqual(before);
  });

  it('thư mục tạm chỉ chủ tiến trình đọc được', async () => {
    const before = await spoolDirs();
    const result = await spoolMultipartFiles(multipart([{ name: 'a.jpg', bytes: filled(10) }]), limits);
    if (!result.ok) throw new Error(result.code);
    const created = join(
      tmpdir(),
      (await spoolDirs()).find((name) => !before.includes(name))!,
    );
    expect((await stat(created)).mode & 0o777).toBe(0o700);
    await result.value.dispose();
    expect(existsSync(created)).toBe(false);
  });
});
