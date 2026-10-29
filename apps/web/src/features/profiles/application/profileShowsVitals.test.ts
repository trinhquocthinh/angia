import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from './ports';
import { profileShowsVitals } from './profileShowsVitals';

afterEach(() => vi.useRealTimers());
describe('TC-440 — web tính tuổi theo năm Việt Nam', () => {
  it('tự hiện lúc sang năm mới ở Việt Nam dù UTC còn năm cũ', () => {
    vi.useFakeTimers();
    const profile = { birthYear: 2011, vitalsEnabled: null } as HealthProfile;
    vi.setSystemTime(new Date('2026-12-31T16:59:59Z'));
    expect(profileShowsVitals(profile)).toBe(false);
    vi.setSystemTime(new Date('2026-12-31T17:00:00Z'));
    expect(profileShowsVitals(profile)).toBe(true);
  });
});
