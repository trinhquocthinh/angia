// Claim đã xác thực từ id_token của Authentik; không chứa token nào (Tech Spec §5.1).
export interface IdentityClaims {
  subject: string;
  name?: string;
  preferredUsername?: string;
  email?: string;
  groups: string[];
}
