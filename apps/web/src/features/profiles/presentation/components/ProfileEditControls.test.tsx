import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { ProfileEditControls } from './ProfileEditControls';
const profile = { id: 'p', familyId: 'f', birthYear: null, consentStatus: 'pending' } as HealthProfile;
const session = { role: 'main', family: { id: 'f', name: 'Nhà' } } as ProfileSession;
describe('TC-449 — quyền mở sửa hồ sơ từ header', () => {
  it('main thấy nút sửa và dải nhắc hồ sơ cũ, năm đã có thì bỏ dải nhắc', () => {
    const html = renderToStaticMarkup(<ProfileEditControls profile={profile} session={session} />);
    expect(html).toContain('Sửa hồ sơ');
    expect(html).toContain('Bổ sung năm sinh');
    const filled = renderToStaticMarkup(
      <ProfileEditControls profile={{ ...profile, birthYear: 2020 }} session={session} />,
    );
    expect(filled).toContain('Sửa hồ sơ');
    expect(filled).not.toContain('Bổ sung năm sinh');
  });
  it.each([
    { ...session, role: 'member' as const },
    { ...session, family: { id: 'other', name: 'Khác' } },
  ])('member hoặc khác gia đình không thấy nút sửa', (context) => {
    expect(renderToStaticMarkup(<ProfileEditControls profile={profile} session={context} />)).toBe('');
  });
  it('không cho mở sửa hồ sơ đã rút đồng thuận', () => {
    expect(
      renderToStaticMarkup(
        <ProfileEditControls profile={{ ...profile, consentStatus: 'withdrawn' }} session={session} />,
      ),
    ).toBe('');
  });
});
