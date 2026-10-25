import { describe, expect, it } from 'vitest';
import { newId } from './newId.js';

describe('newId', () => {
  it('sinh UUID phiên bản 7 tăng dần theo thời gian', () => {
    const first = newId();
    const second = newId();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second > first).toBe(true);
  });
});
