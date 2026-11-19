import { describe, expect, it } from 'vitest';
import { addProfileGuardianRequestSchema } from './profileGuardianSchemas.js';
describe('DTO giám hộ', () => {
  it('TC-810: chỉ nhận UUID tài khoản, không nhận actor hoặc trường thừa', () => {
    const input = { guardianAccountId: '00000000-0000-4000-8000-000000000001' };
    expect(addProfileGuardianRequestSchema.safeParse(input).success).toBe(true);
    for (const bad of [
      {},
      { guardianAccountId: 'sai' },
      { ...input, actorAccountId: input.guardianAccountId },
    ])
      expect(addProfileGuardianRequestSchema.safeParse(bad).success).toBe(false);
  });
});
