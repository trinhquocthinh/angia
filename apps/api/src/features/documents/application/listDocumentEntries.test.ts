import { describe, expect, it } from 'vitest';
import type { DocumentEntryHead } from '../domain/DocumentEntry.js';
import { decodeEntryCursor, encodeEntryCursor } from '../domain/documentEntryCursor.js';
import type { DocumentEntryRepository, EntryHeadQuery } from './documentEntryPorts.js';
import { listDocumentEntries } from './listDocumentEntries.js';

const head = (n: number): DocumentEntryHead => ({
  id: `0192f000-0000-7000-8000-00000000000${n}`,
  origin: 'document',
  type: 'lab_result',
  status: n === 1 ? 'approved' : 'pending_review',
  entryDate: '2026-10-01',
  dateKnown: true,
  createdAt: new Date('2026-10-13T08:00:00Z'),
  createdKey: '2026-10-13T08:00:00.000000Z',
  hasOcrImage: false,
});

function fixture(heads: DocumentEntryHead[], exists = true) {
  const queries: EntryHeadQuery[] = [];
  const repository: DocumentEntryRepository = {
    withFamily: (familyId, work) =>
      work({
        profileExists: async (id) => exists && familyId === 'f' && id === 'p',
        listEntryHeads: async (_p, query) => {
          queries.push(query);
          return heads.slice(0, query.take);
        },
        loadEntryRecords: async (_p, loaded) =>
          new Map(
            loaded
              .filter((h) => h.status === 'approved')
              .map((h) => [h.id, { prescription: null, labResults: [], measurements: [] }]),
          ),
      }),
  };
  return { repository, queries };
}
const request = { familyId: 'f', profileId: 'p', limit: 2 };

describe('listDocumentEntries — danh mục chứng từ của hồ sơ (SPEC-028)', () => {
  it('TC-271: đọc dư 1 mục, cắt trang và cấp cursor của mục cuối trang', async () => {
    const f = fixture([head(1), head(2), head(3)]);
    const result = await listDocumentEntries(f.repository, { ...request, type: 'lab_result' });
    expect(f.queries).toEqual([{ type: 'lab_result', take: 3, after: undefined }]);
    if (!result.ok) throw new Error('Kỳ vọng thành công');
    expect(result.value.items.map((i) => i.id)).toEqual([head(1).id, head(2).id]);
    expect(decodeEntryCursor(result.value.nextCursor!)).toEqual({
      entryDate: '2026-10-01',
      createdKey: '2026-10-13T08:00:00.000000Z',
      id: head(2).id,
    });
  });

  it('TC-270: bản ghi đã lưu gắn đúng mục, mục chưa lưu có records rỗng; hết trang → nextCursor null', async () => {
    const result = await listDocumentEntries(fixture([head(1), head(2)]).repository, request);
    expect(result).toMatchObject({
      ok: true,
      value: {
        nextCursor: null,
        items: [
          { id: head(1).id, records: { prescription: null, labResults: [], measurements: [] } },
          { id: head(2).id, records: { prescription: null, labResults: [], measurements: [] } },
        ],
      },
    });
  });

  it('TC-271: cursor hợp lệ được chuyển xuống truy vấn; cursor hỏng → ERR_VALIDATION', async () => {
    const f = fixture([]);
    const after = { entryDate: '2026-10-01', createdKey: '2026-10-13T08:00:00.000000Z', id: head(1).id };
    await listDocumentEntries(f.repository, { ...request, cursor: encodeEntryCursor(after) });
    expect(f.queries[0]?.after).toEqual(after);
    expect(await listDocumentEntries(f.repository, { ...request, cursor: 'hỏng' })).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it('TC-274: hồ sơ không thuộc gia đình → ERR_NOT_FOUND, không đọc danh mục', async () => {
    const f = fixture([head(1)], false);
    expect(await listDocumentEntries(f.repository, request)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(f.queries).toEqual([]);
  });
});
