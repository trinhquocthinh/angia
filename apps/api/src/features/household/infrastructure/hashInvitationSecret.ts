import { createHash } from 'node:crypto';

// Chỉ chuẩn hoá mã hex 12 ký tự; token base64url phân biệt hoa thường.
export function hashInvitationSecret(value: string): string {
  const trimmed = value.trim();
  const normalized = /^[a-f0-9]{12}$/i.test(trimmed) ? trimmed.toUpperCase() : trimmed;
  return createHash('sha256').update(normalized).digest('hex');
}
