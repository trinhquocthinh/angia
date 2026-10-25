import { describe, expect, it } from 'vitest';
import { classifyFile } from './classifyFile.js';
import { documentObjectKey } from './documentObjectKey.js';
import { MAX_FILE_BYTES } from './SourceDocument.js';

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));
const bytes = (head: number[], size = 64) => {
  const data = new Uint8Array(size);
  data.set(head);
  return data;
};
const ftyp = (major: string, ...compatible: string[]) =>
  bytes([0, 0, 0, 24, ...ascii('ftyp'), ...ascii(major), 0, 0, 0, 0, ...compatible.flatMap(ascii)]);

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = bytes([...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBP')]);

describe('Phân loại tệp tải lên (SPEC-008, BR-011)', () => {
  it.each([
    ['JPEG', JPEG, 'image/jpeg', 'jpg'],
    ['PNG', PNG, 'image/png', 'png'],
    ['WebP', WEBP, 'image/webp', 'webp'],
    ['HEIC iPhone', ftyp('heic', 'mif1', 'heic'), 'image/heic', 'heic'],
    ['HEIF mif1 kèm brand heic', ftyp('mif1', 'mif1', 'heic'), 'image/heic', 'heic'],
  ])('TC-020/TC-025: nhận diện %s theo magic bytes', (_name, data, mimeType, extension) => {
    expect(classifyFile(data)).toEqual({ ok: true, mimeType, extension });
  });

  it.each([
    ['PDF', bytes(ascii('%PDF-1.7'))],
    ['AVIF', ftyp('avif', 'mif1', 'avif')],
    ['mif1 không có brand HEIC', ftyp('mif1', 'mif1', 'avif')],
    ['RIFF không phải WebP', bytes([...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WAVE')])],
    ['tệp rỗng', new Uint8Array(0)],
  ])('TC-024: %s bị từ chối ERR_UNSUPPORTED_FILE', (_name, data) => {
    expect(classifyFile(data)).toEqual({ ok: false, code: 'ERR_UNSUPPORTED_FILE' });
  });

  it('TC-080: đúng 10 MiB được nhận, thêm 1 byte bị từ chối ERR_FILE_TOO_LARGE', () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
    expect(classifyFile(bytes([0xff, 0xd8, 0xff], MAX_FILE_BYTES))).toMatchObject({ ok: true });
    expect(classifyFile(bytes([0xff, 0xd8, 0xff], MAX_FILE_BYTES + 1))).toEqual({
      ok: false,
      code: 'ERR_FILE_TOO_LARGE',
    });
  });

  it('TC-080: chỉ cần phần đầu tệp, dung lượng lấy theo số byte đã nhận (E3-S1-T1)', () => {
    expect(classifyFile(JPEG, MAX_FILE_BYTES)).toMatchObject({ ok: true, mimeType: 'image/jpeg' });
    expect(classifyFile(JPEG, MAX_FILE_BYTES + 1)).toEqual({ ok: false, code: 'ERR_FILE_TOO_LARGE' });
  });

  it('khóa ảnh gốc theo tiền tố families/<f>/profiles/<p>/documents/<id>/', () => {
    expect(documentObjectKey({ familyId: 'f', healthProfileId: 'p', documentId: 'd' }, 'heic')).toBe(
      'families/f/profiles/p/documents/d/original.heic',
    );
  });
});
