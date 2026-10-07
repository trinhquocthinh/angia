import { expect } from 'vitest';

// Hồ sơ nhóm khác và ID không tồn tại phải không phân biệt được qua response.
export async function expectCrossFamilyDenied(
  other: () => Response | Promise<Response>,
  missing: () => Response | Promise<Response>,
) {
  const [a, b] = await Promise.all([other(), missing()]);
  expect(a.status).toBe(404);
  expect(b.status).toBe(404);
  expect(await a.json()).toEqual(await b.json());
}
