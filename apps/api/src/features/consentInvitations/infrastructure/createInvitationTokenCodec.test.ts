import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createInvitationTokenCodec } from './createInvitationTokenCodec.js';

describe('Token mời đồng thuận', () => {
  it('mã hóa phạm vi, ngẫu nhiên mỗi lần và từ chối token sửa đổi hoặc sai khóa', () => {
    const codec = createInvitationTokenCodec('a'.repeat(48));
    const claims = { familyId: randomUUID(), profileId: randomUUID(), invitationId: randomUUID() };
    const token = codec.issue(claims);
    expect(codec.verify(token)).toEqual(claims);
    expect(codec.issue(claims)).not.toBe(token);
    expect(token).not.toContain(claims.familyId);
    expect(codec.hash(token)).toMatch(/^[a-f0-9]{64}$/);
    const parts = token.split('.');
    parts[1] = `${parts[1]![0] === 'A' ? 'B' : 'A'}${parts[1]!.slice(1)}`;
    expect(codec.verify(parts.join('.'))).toBeNull();
    expect(createInvitationTokenCodec('b'.repeat(48)).verify(token)).toBeNull();
    for (const invalid of ['', 'v1.bogus', token + '=', 'x'.repeat(5000)]) {
      expect(codec.verify(invalid)).toBeNull();
    }
  });
});
