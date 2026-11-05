export interface DoseActor {
  accountId: string;
  isMain: boolean;
}
// Người nhận hiện hành của hồ sơ theo BR-039.
export interface DoseAudience {
  linked: boolean;
  recipientIds: string[];
}

// BR-053: quyền phân theo liên kết tài khoản, không theo tuổi. Chưa có bản ghi thì hủy là không làm gì,
// nên cho mọi người có thể xác nhận hoặc `main`; người ngoài vẫn không biết lời nhắc tồn tại.
export function doseConfirmationAccess(
  actor: DoseActor,
  audience: DoseAudience,
  confirmation: { confirmedBy: { accountId: string | null } } | null,
): { mayConfirm: boolean; mayUndo: boolean } {
  const mayConfirm = audience.recipientIds.includes(actor.accountId) || (audience.linked && actor.isMain);
  const mayUndo =
    actor.isMain || (confirmation ? confirmation.confirmedBy.accountId === actor.accountId : mayConfirm);
  return { mayConfirm, mayUndo };
}
