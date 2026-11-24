import { describe, expect, it } from 'vitest';
import { isVerifiedEmailConflict } from './isVerifiedEmailConflict.js';

describe('Ánh xạ xung đột email đã xác minh', () => {
  it('TC-931: nhận đúng constraint PostgreSQL kể cả lỗi được Drizzle bọc', () => {
    const pgError = { code: '23505', constraint: 'accounts_verified_email_unique' };
    expect(isVerifiedEmailConflict(pgError)).toBe(true);
    expect(isVerifiedEmailConflict(new Error('query', { cause: pgError }))).toBe(true);
    expect(isVerifiedEmailConflict({ code: '23505', constraint: 'other' })).toBe(false);
    expect(isVerifiedEmailConflict({ code: '23503', constraint: 'accounts_verified_email_unique' })).toBe(
      false,
    );
    expect(isVerifiedEmailConflict(null)).toBe(false);
  });
});
