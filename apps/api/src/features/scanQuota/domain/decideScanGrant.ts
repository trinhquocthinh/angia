interface CurrentGrant {
  status: 'trial' | 'approved';
  grantedScans: number;
}
// Chỉ Admin mới duyệt approved; trial chỉ phát một lần tại thời điểm tạo gia đình mới.
export function decideScanGrant(current: CurrentGrant | null, grantedScans: number) {
  const delta = grantedScans - (current?.grantedScans ?? 0);
  return delta < 0
    ? { ok: false as const, code: 'ERR_SCAN_QUOTA_DECREASE' as const }
    : { ok: true as const, delta };
}
