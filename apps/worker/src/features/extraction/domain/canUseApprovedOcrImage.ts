export interface OcrImageApproval {
  ocrImageKey: string | null;
  ocrImageSha256: string | null;
  privacyApprovedBy: string | null;
  privacyApprovedAt: Date | null;
}

// BR-041: application tính SHA-256 từ byte đọc thật ở S3 rồi mới kiểm điều kiện này.
// Quyền main/gia đình và việc loại metadata do application/infrastructure cưỡng chế riêng.
export function canUseApprovedOcrImage(
  approval: OcrImageApproval | null,
  originalKey: string,
  actualSha256: string,
): boolean {
  if (!approval) return false;
  const { ocrImageKey, ocrImageSha256, privacyApprovedBy, privacyApprovedAt } = approval;
  return (
    typeof ocrImageKey === 'string' &&
    ocrImageKey.length > 0 &&
    ocrImageKey === ocrImageKey.trim() &&
    ocrImageKey !== originalKey &&
    typeof ocrImageSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(ocrImageSha256) &&
    ocrImageSha256 === actualSha256 &&
    typeof privacyApprovedBy === 'string' &&
    privacyApprovedBy.trim().length > 0 &&
    privacyApprovedAt instanceof Date &&
    Number.isFinite(privacyApprovedAt.getTime())
  );
}
