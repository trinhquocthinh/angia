import type {
  DocumentEntryPage,
  MedicationCourse,
  ReusePrescriptionRequest,
  SourceDocument,
} from '@angia/contracts';

export type EntryTypeFilter = NonNullable<SourceDocument['type']>;
export interface DocumentEntriesRepository {
  page(
    profileId: string,
    query: { type?: EntryTypeFilter | undefined; cursor?: string | undefined },
    signal?: AbortSignal,
  ): Promise<DocumentEntryPage>;
  /** Lỗi ném ReviewRequestError (409 kèm courseConflicts, 422 kèm invalidItemIndexes). */
  reuse(
    profileId: string,
    prescriptionId: string,
    request: ReusePrescriptionRequest,
    csrfToken: string,
  ): Promise<MedicationCourse[]>;
}
