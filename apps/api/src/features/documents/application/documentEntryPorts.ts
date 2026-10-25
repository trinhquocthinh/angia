import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { DocumentEntryHead, EntryCursor, EntryRecords } from '../domain/DocumentEntry.js';
import type { DocumentType } from '../domain/SourceDocument.js';

export interface EntryHeadQuery {
  type?: DocumentType | undefined;
  /** Số mục cần đọc (bên gọi đã cộng 1 để biết còn trang sau). */
  take: number;
  after?: EntryCursor | undefined;
}
interface DocumentEntryStore {
  /** Trạng thái đồng thuận của hồ sơ; null = không có trong gia đình. */
  profileConsent(profileId: string): Promise<ConsentStatus | null>;
  /** Mục mới nhất trước theo (entryDate, createdKey, id) giảm dần, sau `after` nếu có. */
  listEntryHeads(profileId: string, query: EntryHeadQuery): Promise<DocumentEntryHead[]>;
  /** Bản ghi đã lưu của từng mục theo id mục; mục chưa lưu không có trong Map. */
  loadEntryRecords(
    profileId: string,
    heads: readonly DocumentEntryHead[],
  ): Promise<Map<string, EntryRecords>>;
}
export interface DocumentEntryRepository {
  withFamily<T>(familyId: string, work: (store: DocumentEntryStore) => Promise<T>): Promise<T>;
}
