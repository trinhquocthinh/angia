import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileConsentStatus } from './ProfileConsentStatus';
import type { HealthProfile } from '../../application/ports';
const profile: HealthProfile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Bé',
  birthYear: null,
  vitalsEnabled: null,
  consentConfirmedAt: '2026-10-26T18:30:00Z',
  consentConfirmedBy: 'main',
  consentBasis: 'guardian',
  consentStatus: 'confirmed',
  consentSource: 'main_attested',
  consentRespondentName: 'Mẹ',
  createdAt: '2026-10-26T00:00:00Z',
};
describe('TC-558 — bằng chứng đồng thuận trên thẻ hồ sơ', () => {
  it.each(['main_attested', 'self', 'invitation'] as const)('nhận nguồn %s đã xác nhận', (source) => {
    const html = renderToStaticMarkup(
      <ProfileConsentStatus profile={{ ...profile, consentSource: source }} />,
    );
    expect(html).toContain('Đã đồng ý chia sẻ');
    expect(html).toContain('27/10/2026');
  });
});
