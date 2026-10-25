import type { DocumentFilter, DocumentPage, ReviewRepository } from './reviewPorts.js';

// Hàng đợi chờ duyệt và các bộ lọc chứng từ trong phạm vi gia đình của phiên (SPEC-006), phân trang F09a.
export function listDocuments(
  repository: ReviewRepository,
  familyId: string,
  filter: DocumentFilter,
): Promise<DocumentPage> {
  return repository.withFamily(familyId, (store) => store.listDocuments(filter));
}
