interface DocumentLocation {
  familyId: string;
  healthProfileId: string;
  documentId: string;
}

// Tiền tố theo gia đình/hồ sơ để xóa triệt để theo hồ sơ (SPEC-007); không dùng tên tệp người dùng.
export function documentObjectKey(location: DocumentLocation, extension: string): string {
  const { familyId, healthProfileId, documentId } = location;
  return `families/${familyId}/profiles/${healthProfileId}/documents/${documentId}/original.${extension}`;
}
