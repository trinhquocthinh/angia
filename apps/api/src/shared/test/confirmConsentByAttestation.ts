import { expect } from 'vitest';
import { ATTESTATION, attestationPath } from './profileConsentFixture.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Từ E14 link đồng thuận ẩn danh đã ngừng: main cam kết (LG-02) để hồ sơ sang `confirmed`.
export async function confirmConsentByAttestation(t: ProfileTestApp, main: SeededSession, profileId: string) {
  const response = await t.call(main, 'POST', attestationPath(profileId), ATTESTATION);
  expect(response.status).toBe(200);
}
