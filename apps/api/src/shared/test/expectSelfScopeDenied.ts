import { expect } from 'vitest';

// Cùng gia đình, khác hồ sơ (SPEC-042): route tự xem không nhận id nên đích là nội dung trả về.
export async function expectSelfScopeDenied(
  read: () => Response | Promise<Response>,
  ownMarker: string,
  foreignMarkers: readonly string[],
) {
  const response = await read();
  expect(response.status).toBe(200);
  const body = await response.text();
  expect(body).toContain(ownMarker);
  for (const marker of foreignMarkers) expect(body).not.toContain(marker);
}
