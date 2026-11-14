import { describe, expect, it } from 'vitest';
import { parseLegalManifest } from './parseLegalManifest.js';
import { assertLegalDocumentUnchanged } from './assertLegalDocumentUnchanged.js';

const entry = {
  kind: 'terms',
  version: '0.0-draft',
  publishedAt: '2026-11-14T00:00:00.000Z',
  material: true,
  file: 'legal/terms.md',
};
describe('Manifest seed legal bất biến', () => {
  it('TC-752: nhận manifest hợp lệ và chuẩn hoá ngày', () => {
    expect(parseLegalManifest([entry])).toEqual([entry]);
  });
  it.each([
    null,
    [],
    [{}],
    [{ ...entry, kind: 'other' }],
    [{ ...entry, publishedAt: 'sai' }],
    [{ ...entry, file: '../terms.md' }],
    [{ ...entry, file: '/legal/terms.md' }],
    [entry, entry],
  ])('TC-752: từ chối manifest sai %j', (input) => expect(() => parseLegalManifest(input)).toThrow());
  it('TC-752: cùng nội dung và metadata được chạy lại', () => {
    const record = {
      sha256: 'a'.repeat(64),
      material: true,
      publishedAt: new Date(entry.publishedAt),
      contentPath: entry.file,
    };
    expect(() => assertLegalDocumentUnchanged(record, record)).not.toThrow();
    for (const change of [
      { sha256: 'b'.repeat(64) },
      { material: false },
      { publishedAt: new Date('2027-01-01') },
      { contentPath: 'legal/other.md' },
    ]) {
      expect(() => assertLegalDocumentUnchanged(record, { ...record, ...change })).toThrow();
    }
  });
});
