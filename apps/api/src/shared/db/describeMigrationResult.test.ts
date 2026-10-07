import { describe, expect, it } from 'vitest';
import { describeMigrationResult } from './describeMigrationResult.js';

describe('describeMigrationResult', () => {
  it('báo không còn migration chờ khi không áp dụng bản nào', () => {
    expect(describeMigrationResult(0)).toBe('No pending migrations');
  });

  it('báo số migration vừa áp dụng', () => {
    expect(describeMigrationResult(1)).toBe('Applied 1 migration');
    expect(describeMigrationResult(3)).toBe('Applied 3 migrations');
  });
});
