import type { IdentityClaims } from '../domain/IdentityClaims.js';

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

// Ánh xạ claim id_token (đã được openid-client xác thực chữ ký/iss/aud/nonce) sang kiểu domain.
export function toIdentityClaims(claims: Record<string, unknown>): IdentityClaims {
  const subject = optionalString(claims.sub);
  if (!subject) {
    throw new Error('id_token thiếu claim sub');
  }
  const groups = Array.isArray(claims.groups)
    ? claims.groups.filter((group): group is string => typeof group === 'string')
    : [];
  const result: IdentityClaims = { subject, groups };
  const name = optionalString(claims.name);
  const preferredUsername = optionalString(claims.preferred_username);
  const email = optionalString(claims.email);
  if (name !== undefined) result.name = name;
  if (preferredUsername !== undefined) result.preferredUsername = preferredUsername;
  if (email !== undefined) result.email = email;
  return result;
}
