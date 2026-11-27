import { describe, expect, it } from 'vitest';
import { rateLimitPolicies } from './rateLimitPolicies.js';

describe('Bảng ngưỡng SPEC-078', () => {
  it.each([
    ['login_failed_ip', 30, 900_000],
    ['invitation_create', 20, 86_400_000],
    ['invitation_accept_invalid', 20, 3_600_000],
  ])('SPEC-078: %s có ngưỡng %i trong %i ms', (kind, limit, windowMs) => {
    expect(rateLimitPolicies).toHaveProperty(String(kind), { kind, limit, windowMs });
  });
});
