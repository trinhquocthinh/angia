import type { IdentityClaims } from './IdentityClaims.js';

// Authentik là nguồn sự thật cho tên hiển thị: name → preferred_username → email → sub.
export function resolveDisplayName(claims: IdentityClaims): string {
  const candidates = [claims.name, claims.preferredUsername, claims.email];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return claims.subject;
}
