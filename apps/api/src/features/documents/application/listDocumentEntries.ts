import type { DocumentEntry } from '../domain/DocumentEntry.js';
import { decodeEntryCursor, encodeEntryCursor } from '../domain/documentEntryCursor.js';
import type { DocumentType } from '../domain/SourceDocument.js';
import type { DocumentEntryRepository } from './documentEntryPorts.js';

interface ListDocumentEntriesRequest {
  familyId: string;
  profileId: string;
  type?: DocumentType | undefined;
  limit: number;
  cursor?: string | undefined;
}
type ListDocumentEntriesOutcome =
  | { ok: true; value: { items: DocumentEntry[]; nextCursor: string | null } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_VALIDATION' };

const EMPTY = { prescription: null, labResults: [], measurements: [] };

// SPEC-028: danh mục chứng từ + bản nhập tay của hồ sơ, keyset (entryDate, createdKey, id) giảm dần.
export function listDocumentEntries(
  repository: DocumentEntryRepository,
  request: ListDocumentEntriesRequest,
): Promise<ListDocumentEntriesOutcome> {
  const after = request.cursor === undefined ? undefined : decodeEntryCursor(request.cursor);
  if (after === null) return Promise.resolve({ ok: false, code: 'ERR_VALIDATION' });
  return repository.withFamily(request.familyId, async (store) => {
    if (!(await store.profileExists(request.profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    const heads = await store.listEntryHeads(request.profileId, {
      type: request.type,
      take: request.limit + 1,
      after,
    });
    const page = heads.slice(0, request.limit);
    const records = await store.loadEntryRecords(request.profileId, page);
    const last = page[page.length - 1];
    return {
      ok: true,
      value: {
        items: page.map((head) => ({ ...head, records: records.get(head.id) ?? EMPTY })),
        nextCursor:
          heads.length > request.limit && last
            ? encodeEntryCursor({ entryDate: last.entryDate, createdKey: last.createdKey, id: last.id })
            : null,
      },
    };
  });
}
