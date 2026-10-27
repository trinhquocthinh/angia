import { expect } from 'vitest';
import type { HealthProfile, ConsentInvitationCreated } from '@angia/contracts';
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
export const invitationCall = (t: ProfileTestApp, token: string, body?: unknown) =>
  t.app.request(`/api/consent-invitations/${body === undefined ? 'view' : 'respond'}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      origin: 'http://localhost:5173',
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export async function profileConsentFixture(t: ProfileTestApp) {
  const familyId = await t.family();
  const main = await t.session(familyId);
  const create = async (input: object = {}) => {
    const response = await t.call(main, 'POST', PROFILE_BASE, { displayName: 'Bé An', ...input });
    expect(response.status).toBe(201);
    return (await response.json()) as HealthProfile;
  };
  const invite = async (id: string) => {
    const response = await t.call(main, 'POST', `${PROFILE_BASE}/${id}/consent-invitations`, {
      attestation: true,
    });
    expect(response.status).toBe(201);
    return (await response.json()) as ConsentInvitationCreated;
  };
  const snapshot = async (id: string) => ({
    profile: (await t.owner.query('SELECT * FROM health_profiles WHERE id=$1', [id])).rows[0],
    invitations: (
      await t.owner.query('SELECT * FROM consent_invitations WHERE profile_id=$1 ORDER BY id', [id])
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
