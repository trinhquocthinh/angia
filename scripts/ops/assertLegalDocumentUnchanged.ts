interface ImmutableLegalDocument {
  sha256: string;
  material: boolean;
  publishedAt: Date;
  contentPath: string;
}

export function assertLegalDocumentUnchanged(
  existing: ImmutableLegalDocument,
  incoming: ImmutableLegalDocument,
): void {
  if (
    existing.sha256 !== incoming.sha256 ||
    existing.material !== incoming.material ||
    existing.publishedAt.getTime() !== incoming.publishedAt.getTime() ||
    existing.contentPath !== incoming.contentPath
  ) {
    throw new Error('Văn bản pháp lý đã tồn tại có nội dung hoặc metadata khác; không được sửa bản cũ');
  }
}
