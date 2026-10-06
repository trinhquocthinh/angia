import type { InvitationReceipt } from '../application/invitationPorts';
export function invitationReceiptMessage(receipt: InvitationReceipt): string {
  if (receipt.outcome === 'recorded')
    return receipt.decision === 'accepted'
      ? 'Đã ghi nhận sự đồng ý của bạn.'
      : 'Đã ghi nhận quyết định từ chối của bạn.';
  const time = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(receipt.respondedAt));
  return `Lời mời đã được ${receipt.respondentName} ${receipt.decision === 'accepted' ? 'đồng ý' : 'từ chối'} lúc ${time}. Phản hồi của bạn không được ghi thêm.`;
}
