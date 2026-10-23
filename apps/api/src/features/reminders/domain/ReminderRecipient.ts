// BR-039: đối tượng nhận lời nhắc của hồ sơ. Hồ sơ liên kết tài khoản → chính tài khoản đó (cố định);
// hồ sơ không liên kết (trẻ nhỏ) → các tài khoản `main` cùng gia đình được chỉ định.
export interface FamilyAccount {
  id: string;
  displayName: string;
  role: 'main' | 'member';
  healthProfileId: string | null;
}
export interface RecipientAccount {
  accountId: string;
  displayName: string;
}
export interface ReminderRecipients {
  mode: 'linked' | 'assigned';
  recipients: RecipientAccount[];
  /** Tài khoản `main` hiện hành có thể được chỉ định. */
  candidates: RecipientAccount[];
}
