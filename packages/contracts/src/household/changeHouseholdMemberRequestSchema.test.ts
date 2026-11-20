import { expect, it } from 'vitest';
import { changeHouseholdMemberRequestSchema } from './changeHouseholdMemberRequestSchema.js';

it('TC-782: chỉ nhận đổi vai trò hợp lệ hoặc gỡ, không nhận trường thừa', () => {
  for (const body of [
    { action: 'remove' },
    { action: 'change_role', role: 'main' },
    { action: 'change_role', role: 'member' },
  ])
    expect(changeHouseholdMemberRequestSchema.safeParse(body).success).toBe(true);
  for (const body of [
    {},
    { action: 'change_role' },
    { action: 'remove', role: 'main' },
    { action: 'change_role', role: 'owner' },
  ])
    expect(changeHouseholdMemberRequestSchema.safeParse(body).success).toBe(false);
});
