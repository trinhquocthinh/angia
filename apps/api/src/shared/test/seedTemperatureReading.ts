import { expect } from 'vitest';
import type { SeededSession } from './seedAuthFixtures.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Một lần đo 37 °C cách đây một phút qua API (SPEC-048); trả id bản ghi.
export async function seedTemperatureReading(t: ProfileTestApp, main: SeededSession, profileId: string) {
  const response = await t.call(main, 'POST', `/api/health-profiles/${profileId}/temperatures`, {
    celsius: 37,
    measuredAt: new Date(Date.now() - 60_000).toISOString(),
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { id: string }).id;
}
