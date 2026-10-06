import type { ConsentResponse } from '../application/ports';
export function consentMessage(result: ConsentResponse) {
  if (result.outcome === 'confirmed') return 'Đã ghi nhận xác nhận đồng thuận của bạn.';
  const time = result.profile.consentConfirmedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(result.profile.consentConfirmedAt))
    : 'thời điểm đã ghi nhận';
  const name = result.confirmedByDisplayName ? ` được ${result.confirmedByDisplayName}` : ' được';
  return `Hồ sơ đã${name} xác nhận lúc ${time}. Xác nhận của bạn không được ghi thêm.`;
}
