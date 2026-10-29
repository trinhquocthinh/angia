export interface ImageApproval {
  imageKey: string | null;
  imageSha256: string | null;
  privacyApprovedBy: string | null;
  privacyApprovedAt: Date | null;
}

// BR-041: application tính SHA-256 từ byte đọc thật ở S3 rồi mới kiểm điều kiện này.
// Quyền main/gia đình và việc loại metadata do application/infrastructure cưỡng chế riêng.
export function canUseApprovedImage(approval: ImageApproval | null, actualSha256: string): boolean {
  if (!approval) return false;
  const { imageKey, imageSha256, privacyApprovedBy, privacyApprovedAt } = approval;
  return (
    typeof imageKey === 'string' &&
    imageKey.length > 0 &&
    imageKey === imageKey.trim() &&
    typeof imageSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(imageSha256) &&
    imageSha256 === actualSha256 &&
    typeof privacyApprovedBy === 'string' &&
    privacyApprovedBy.trim().length > 0 &&
    privacyApprovedAt instanceof Date &&
    Number.isFinite(privacyApprovedAt.getTime())
  );
}
