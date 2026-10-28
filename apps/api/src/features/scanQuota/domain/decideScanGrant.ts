interface CurrentGrant {
  status: 'default' | 'trial' | 'approved';
  grantedScans: number;
}
// Chỉ Admin mới duyệt approved; gia đình chưa có dòng tháng được tính như lượt mặc định (CP5.5).
export function decideScanGrant(current: CurrentGrant | null, grantedScans: number) {
  const delta = grantedScans - (current?.grantedScans ?? 0);
  return delta < 0
    ? { ok: false as const, code: 'ERR_SCAN_QUOTA_DECREASE' as const }
    : { ok: true as const, delta };
}
