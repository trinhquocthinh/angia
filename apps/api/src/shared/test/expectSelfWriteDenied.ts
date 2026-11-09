import { expect } from 'vitest';

interface SelfWriteProbes {
  sameFamilyOtherProfile: () => Response | Promise<Response>;
  otherFamily: () => Response | Promise<Response>;
  snapshot: () => Promise<unknown>;
}

// Snapshot phải dùng role owner, chụp cả dữ liệu không thấy được qua RLS của phiên.
export async function expectSelfWriteDenied(route: string, probes: SelfWriteProbes) {
  let firstBody: unknown;
  for (const target of ['sameFamilyOtherProfile', 'otherFamily'] as const) {
    const context = `${route} — ${target}`;
    const before = await probes.snapshot();
    const response = await probes[target]();
    expect(response.status, context).toBe(404);
    const body: unknown = await response.json();
    expect(body, context).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect(await probes.snapshot(), context).toEqual(before);
    if (target === 'sameFamilyOtherProfile') firstBody = body;
    else expect(body, context).toEqual(firstBody);
  }
}
