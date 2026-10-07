import type { ConsentInvitationCreated } from '@angia/contracts';
import { expect } from 'vitest';
import type { SeededSession } from './seedAuthFixtures.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Đi đúng luồng thật: main tạo link mời, người nhận đồng ý. Trả token đã dùng (để giả mạo phạm vi).
export async function acceptConsentInvitation(t: ProfileTestApp, main: SeededSession, profileId: string) {
  const invitation = await t.call(main, 'POST', `/api/health-profiles/${profileId}/consent-invitations`);
  const { token } = (await invitation.json()) as ConsentInvitationCreated;
  const responded = await t.app.request('/api/consent-invitations/respond', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    },
    body: JSON.stringify({ decision: 'accepted', basis: 'self', respondentName: 'Mẹ' }),
  });
  expect(responded.status).toBe(200);
  return token;
}
