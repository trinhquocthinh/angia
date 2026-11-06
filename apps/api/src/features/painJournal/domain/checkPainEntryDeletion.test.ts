import { describe, expect, it } from 'vitest';
import { checkPainEntryDeletion } from './checkPainEntryDeletion.js';

describe('Không xóa lần ghi cuối — BR-060', () => {
  it('TC-678: còn một lần ghi thì yêu cầu xóa vấn đề', () => {
    expect(checkPainEntryDeletion(1)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { reason: 'last_entry' },
    });
  });

  it('TC-678: cho phép xóa khi vẫn còn lần ghi khác', () => {
    expect(checkPainEntryDeletion(2)).toEqual({ ok: true });
  });
});
