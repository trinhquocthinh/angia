type FamilyRole = 'main' | 'member';

// Ngữ cảnh của một phiên còn hạn: tài khoản, nhóm và vai trò; family/role null = chờ gán nhóm (/waiting).
export interface SessionContext {
  sessionId: string;
  csrfToken: string;
  expiresAt: Date;
  account: {
    id: string;
    displayName: string;
    isSystemAdmin: boolean;
    healthProfileId: string | null;
  };
  family: { id: string; name: string } | null;
  role: FamilyRole | null;
}
