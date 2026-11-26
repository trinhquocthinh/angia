import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import { ProfileDirectory } from './ProfileDirectory';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, search }: { children: ReactNode; to: string; search?: { section?: string } }) => (
    <a href={`${to}${search?.section ? `?section=${search.section}` : ''}`}>{children}</a>
  ),
}));
const profile = { id: 'p', birthYear: 1954, hasLinkedAccount: false } as ProfileListItem;
const session = { role: 'main' } as ProfileSession;
const render = (patch: Partial<ProfileListItem> = {}) =>
  renderToStaticMarkup(<ProfileDirectory profile={{ ...profile, ...patch }} session={session} />);

describe('SPEC-081 — mục lục hồ sơ 3D Bento v2.0', () => {
  it('mở số đo bằng search riêng, giữ đủ lối vào các mục cũ và dùng icon 3D đất sét', () => {
    const html = render();
    expect(html).toContain('?section=health');
    expect(html).toContain('/images/profile-sections/medications-3d.png');
    expect(html).toContain('/images/account-menu/notification-bell-3d.png');
    expect(html).toContain('/images/profile-sections/health-3d.png');
    for (const path of [
      'medications',
      'reminders',
      'lab-results',
      'pain',
      'timeline',
      'revisits',
      'documents',
      'prescriptions',
      'manual',
    ])
      expect(html).toContain(`/profiles/$profileId/${path}`);
    expect(html).not.toContain('Người giám hộ');
  });
  it('trẻ chưa liên kết có mục giám hộ với icon 3D và không có số đo', () => {
    const html = render({ birthYear: 2020, vitalsEnabled: null });
    expect(html).toContain('Người giám hộ');
    expect(html).toContain('/images/profile-sections/guardians-3d.png');
    expect(html).not.toContain('?section=health');
  });
  it('trẻ đã liên kết không có mục giám hộ; số đo theo cờ hiện hành', () => {
    const html = render({ birthYear: 2020, hasLinkedAccount: true, vitalsEnabled: true });
    expect(html).not.toContain('Người giám hộ');
    expect(html).toContain('?section=health');
  });
});
