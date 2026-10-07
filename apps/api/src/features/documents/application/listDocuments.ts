import type { SourceDocument } from '../domain/SourceDocument.js';
import type { DocumentFilter, ReviewRepository } from './reviewPorts.js';

// Hàng đợi chờ duyệt và các bộ lọc chứng từ trong phạm vi gia đình của phiên (SPEC-006).
export function listDocuments(
  repository: ReviewRepository,
  familyId: string,
  filter: DocumentFilter,
): Promise<SourceDocument[]> {
  return repository.withFamily(familyId, (store) => store.listDocuments(filter));
}
