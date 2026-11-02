import { expect } from 'vitest';
import type { HealthProfile, ProfileLinkCreated } from '@angia/contracts';
import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';

export const PROFILE_BASE = '/api/health-profiles';
export const ATTESTATION = {
  kind: 'attestation',
  attestation: true,
  basis: 'guardian',
  respondentName: '  Mẹ  ',
} as const;
export const attestationPath = (id: string) => `${PROFILE_BASE}/${id}/consent-attestation`;
export const linkToken = (link: ProfileLinkCreated) => link.url.split('#')[1]!;
// SPEC-040: xem/xác nhận link cần phiên của người được mời; token đi trong Authorization.
export const linkCall = (t: ProfileTestApp, user: SeededSession, token: string, body?: unknown) =>
  t.app.request(`/api/me/link-invitations/${body === undefined ? 'view' : 'accept'}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      cookie: user.cookie,
      'x-csrf-token': user.csrf,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export async function profileConsentFixture(t: ProfileTestApp) {
  const familyId = await t.family();
  const main = await t.session(familyId);
  const create = async (input: object = {}) => {
    const response = await t.call(main, 'POST', PROFILE_BASE, {
      birthYear: 1950,
      displayName: 'Bé An',
      ...input,
    });
    expect(response.status).toBe(201);
    return (await response.json()) as HealthProfile;
  };
  const invite = async (id: string) => {
    const response = await t.call(main, 'POST', `${PROFILE_BASE}/${id}/link-invitations`, {});
    expect(response.status).toBe(201);
    const link = (await response.json()) as ProfileLinkCreated;
    return { ...link, token: linkToken(link) };
  };
  const snapshot = async (id: string) => ({
    profile: (await t.owner.query('SELECT * FROM health_profiles WHERE id=$1', [id])).rows[0],
    invitations: (
      await t.owner.query('SELECT * FROM profile_link_invitations WHERE profile_id=$1 ORDER BY id', [id])
    ).rows,
  });
  const upload = (user: SeededSession, id: string) => {
    const form = new FormData();
    form.append('files', new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9])], 'a.jpg'));
    return t.app.request(`${PROFILE_BASE}/${id}/upload-batches`, {
      method: 'POST',
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf },
      body: form,
    });
  };
  return { familyId, main, create, invite, snapshot, upload };
}
// Đi đúng luồng SPEC-040: main tạo link, tài khoản được mời đồng ý → hồ sơ gắn tài khoản và `confirmed` nguồn `self`.
export async function linkAccountToProfile(
  t: ProfileTestApp,
  main: SeededSession,
  member: SeededSession,
  profileId: string,
) {
  const created = await t.call(main, 'POST', `${PROFILE_BASE}/${profileId}/link-invitations`, {});
  expect(created.status).toBe(201);
  const accepted = await linkCall(t, member, linkToken((await created.json()) as ProfileLinkCreated), {
    decision: 'accepted',
  });
  expect(accepted.status).toBe(200);
}
