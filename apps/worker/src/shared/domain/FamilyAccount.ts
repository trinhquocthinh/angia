// Tài khoản trong gia đình dùng chung cho các job lời nhắc (BR-039): vai trò và hồ sơ liên kết hiện hành.
export interface FamilyAccount {
  id: string;
  role: 'main' | 'member';
  healthProfileId: string | null;
}
