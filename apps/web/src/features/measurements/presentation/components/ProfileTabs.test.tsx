import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ProfileHealthHeader } from './ProfileHealthHeader';
import type { HealthProfile } from '@src/features/profiles/application/ports';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
const profile = {
  id: 'p',
  displayName: 'Bé An',
  consentStatus: 'confirmed',
  birthYear: null,
  vitalsEnabled: null,
} as HealthProfile;
describe('TC-446 — tab theo độ tuổi', () => {
  it.each([
    [2011, null, false],
    [2010, null, true],
    [null, null, true],
    [2021, true, true],
    [1986, false, true],
  ] as const)('năm sinh %s, bật %s → hiện tab %s', (birthYear, vitalsEnabled, visible) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T00:00:00Z'));
    try {
      const html = renderToStaticMarkup(
        <ProfileHealthHeader profile={{ ...profile, birthYear, vitalsEnabled }} active="medications" />,
      );
      expect(html.includes('Diễn biến sức khỏe')).toBe(visible);
      for (const label of ['Thuốc điều trị', 'Kết quả xét nghiệm', 'Hồ sơ &amp; Giấy tờ khám'])
        expect(html).toContain(label);
    } finally {
      vi.useRealTimers();
    }
  });
});
