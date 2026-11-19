import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ownershipOfferRequestSchema,
  ownershipDecisionRequestSchema,
  currentOwnershipOfferResponseSchema,
} from './ownershipOfferSchemas.js';

describe('SPEC-068: dữ liệu trao quyền Chủ hộ', () => {
  it('TC-797: nhận UUID người nhận và quyết định boolean', () => {
    expect(ownershipOfferRequestSchema.safeParse({ targetAccountId: randomUUID() }).success).toBe(true);
    for (const accept of [true, false])
      expect(ownershipDecisionRequestSchema.parse({ accept })).toEqual({ accept });
  });
  it('TC-799: từ chối trường thừa, thiếu và sai kiểu', () => {
    for (const input of [
      {},
      { targetAccountId: 'sai' },
      { targetAccountId: randomUUID(), familyId: randomUUID() },
    ])
      expect(ownershipOfferRequestSchema.safeParse(input).success).toBe(false);
    for (const input of [{}, { accept: 'true' }, { accept: true, offerId: randomUUID() }])
      expect(ownershipDecisionRequestSchema.safeParse(input).success).toBe(false);
  });
});

it('TC-926: đề nghị hiện tại có hai tài khoản và chỉ trạng thái pending', () => {
  const value = {
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date(0).toISOString(),
    offeredBy: { accountId: randomUUID(), displayName: 'An' },
    target: { accountId: randomUUID(), displayName: 'Bình' },
  };
  expect(currentOwnershipOfferResponseSchema.parse(value)).toEqual(value);
  for (const invalid of [
    { ...value, status: 'accepted' },
    { ...value, target: {} },
    { ...value, createdAt: 'sai' },
  ])
    expect(currentOwnershipOfferResponseSchema.safeParse(invalid).success).toBe(false);
});
