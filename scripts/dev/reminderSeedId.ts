import { createHash } from 'node:crypto';

// Namespace riêng E30; cùng gia đình và khóa cho cùng UUID, không chạm vào ID có sẵn của người dùng.
export function reminderSeedId(familyId: string, key: string): string {
  const hash = createHash('sha256').update(`angia-e30-reminder-ui:${familyId}:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
