import { describe, expect, it } from 'vitest';
import { consentGate } from './consentGate.js';

describe('Cổng đồng thuận dùng chung', () => {
  it('TC-374 cổng đồng thuận: không có hồ sơ → ERR_NOT_FOUND', () => {
    expect(consentGate(null)).toBe('ERR_NOT_FOUND');
  });

  it('TC-374 cổng đồng thuận: pending/invited/declined/withdrawn → ERR_CONSENT_REQUIRED', () => {
    for (const status of ['pending', 'invited', 'declined', 'withdrawn'] as const) {
      expect(consentGate(status)).toBe('ERR_CONSENT_REQUIRED');
    }
  });

  it('TC-374 cổng đồng thuận: confirmed → null (cho qua)', () => {
    expect(consentGate('confirmed')).toBeNull();
  });
});
