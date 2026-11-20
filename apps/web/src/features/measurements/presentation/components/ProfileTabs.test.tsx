import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ProfileHealthHeader } from './ProfileHealthHeader';
import { ProfileTabs } from './ProfileTabs';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, 'aria-current': ariaCurrent }: { children: ReactNode; 'aria-current'?: 'page' }) => (
    <a aria-current={ariaCurrent}>{children}</a>
  ),
}));

const profile = {
  id: 'p',
  displayName: 'Bé An',
  consentStatus: 'confirmed',
  birthYear: null,
  vitalsEnabled: null,
  hasLinkedAccount: false,
} as ProfileListItem;

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
        <ProfileHealthHeader
          session={{ role: 'member' } as ProfileSession}
          profile={{ ...profile, birthYear, vitalsEnabled }}
          active="medications"
        />,
      );
      expect(html.includes('Diễn biến sức khỏe')).toBe(visible);
      for (const label of [
        'Thuốc điều trị',
        'Kết quả xét nghiệm',
        'Hồ sơ &amp; Giấy tờ khám',
        'Lịch tái khám',
      ])
        expect(html).toContain(label);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('TC-816 — tab Người giám hộ trong thanh tab hồ sơ', () => {
  it('TC-816 — ProfileTabs ẩn tab Người giám hộ theo mặc định và hiện khi showsGuardians=true', () => {
    const hidden = renderToStaticMarkup(<ProfileTabs profileId="p" active="medications" />);
    expect(hidden).not.toContain('Người giám hộ');

    const shown = renderToStaticMarkup(
      <ProfileTabs profileId="p" active="guardians" showsVitals={false} showsGuardians />,
    );
    expect(shown).toContain('Người giám hộ');
    expect(shown).toContain('aria-current="page"');
  });

  it.each([
    ['trẻ chưa liên kết + main', { birthYear: 2020, hasLinkedAccount: false }, 'main', true],
    ['trẻ đã liên kết + main', { birthYear: 2020, hasLinkedAccount: true }, 'main', false],
    ['người lớn + main', { birthYear: 1990, hasLinkedAccount: false }, 'main', false],
    ['chưa rõ năm sinh + main', { birthYear: null, hasLinkedAccount: false }, 'main', false],
    ['trẻ chưa liên kết + member', { birthYear: 2020, hasLinkedAccount: false }, 'member', false],
  ] as const)('TC-816 — ProfileHealthHeader (%s) → hiện tab Người giám hộ: %s', (_, patch, role, visible) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T00:00:00Z'));
    try {
      const html = renderToStaticMarkup(
        <ProfileHealthHeader
          session={{ role } as ProfileSession}
          profile={{ ...profile, ...patch }}
          active="medications"
        />,
      );
      expect(html.includes('Người giám hộ')).toBe(visible);
    } finally {
      vi.useRealTimers();
    }
  });
});
