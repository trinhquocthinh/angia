import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { z } from 'zod';
const context = 'angia:household-invitation:v1';
const payload = z.strictObject({ token: z.string().min(1), code: z.string().min(1) });
export function createInvitationSecretCipher(secret: string) {
  if (secret.length < 32) throw new Error('Thiếu khóa mã hóa lời mời');
  const key = Buffer.from(hkdfSync('sha256', secret, '', context, 32));
  const aad = (family: string, id: string) => Buffer.from(JSON.stringify([context, family, id]));
  return {
    seal(family: string, id: string, value: z.infer<typeof payload>) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(aad(family, id));
      const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return `v1.${Buffer.concat([iv, data, cipher.getAuthTag()]).toString('base64url')}`;
    },
    open(family: string, id: string, value: string) {
      if (!/^v1\.[A-Za-z0-9_-]+$/.test(value)) throw new Error('Bản mã lời mời không hợp lệ');
      const data = Buffer.from(value.slice(3), 'base64url');
      const cipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
      cipher.setAAD(aad(family, id));
      cipher.setAuthTag(data.subarray(-16));
      const raw = Buffer.concat([cipher.update(data.subarray(12, -16)), cipher.final()]);
      return payload.parse(JSON.parse(raw.toString('utf8')));
    },
  };
}
export type InvitationSecretCipher = ReturnType<typeof createInvitationSecretCipher>;
