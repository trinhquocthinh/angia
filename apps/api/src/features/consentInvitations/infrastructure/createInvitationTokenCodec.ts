import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { InvitationTokenCodec } from '../application/ports.js';

const payloadSchema = z
  .object({
    familyId: z.uuid(),
    profileId: z.uuid(),
    invitationId: z.uuid(),
    nonce: z.string().length(43),
  })
  .strict();
const context = 'angia:consent-invitation:v1';

// Khóa riêng theo context; token chỉ ở fragment/Authorization, DB giữ SHA-256.
export function createInvitationTokenCodec(secret: string): InvitationTokenCodec {
  const key = Buffer.from(hkdfSync('sha256', secret, '', context, 32));
  return {
    hash: (token) => createHash('sha256').update(token).digest('hex'),
    issue: (claims) => {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(context));
      const payload = JSON.stringify({ ...claims, nonce: randomBytes(32).toString('base64url') });
      const data = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final(), cipher.getAuthTag()]);
      return `v1.${Buffer.concat([iv, data]).toString('base64url')}`;
    },
    verify: (token) => {
      if (token.length > 2048 || !/^v1\.[A-Za-z0-9_-]+$/.test(token)) return null;
      try {
        const encoded = token.slice(3);
        const data = Buffer.from(encoded, 'base64url');
        if (data.length < 29 || data.toString('base64url') !== encoded) return null;
        const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
        decipher.setAAD(Buffer.from(context));
        decipher.setAuthTag(data.subarray(-16));
        const raw = Buffer.concat([decipher.update(data.subarray(12, -16)), decipher.final()]);
        const parsed = payloadSchema.safeParse(JSON.parse(raw.toString('utf8')));
        if (!parsed.success) return null;
        const { familyId, profileId, invitationId } = parsed.data;
        return { familyId, profileId, invitationId };
      } catch {
        return null;
      }
    },
  };
}
