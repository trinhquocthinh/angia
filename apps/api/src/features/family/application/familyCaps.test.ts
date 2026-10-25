import { describe, expect, it } from 'vitest';
import type { FamilyCapDependencies } from './familyCapPorts.js';
import { listFamilyExtractionCaps } from './listFamilyExtractionCaps.js';
import { setFamilyExtractionCap } from './setFamilyExtractionCap.js';

function deps(initialCap: number | null, spentUsd = 0.21) {
  const state = { cap: initialCap, requeued: 0, exists: true };
  const d: FamilyCapDependencies = {
    defaultFamilyCapUsd: 0.5,
    now: () => new Date('2026-10-15T03:00:00Z'),
    repository: {
      list: async () => [{ familyId: 'f1', familyName: 'Nhà A', capUsd: state.cap, spentUsd }],
      inTransaction: async (_familyId, work) =>
        work({
          lockFamily: async () => (state.exists ? { familyName: 'Nhà A', capUsd: state.cap } : null),
          readSpent: async () => spentUsd,
          setCap: async (_id, capUsd) => {
            state.cap = capUsd;
          },
          requestRequeue: async () => {
            state.requeued += 1;
          },
        }),
    },
  };
  return { d, state };
}

describe('Trần chi phí OCR theo gia đình — quản trị (SPEC-031)', () => {
  it('liệt kê trần hiệu lực: để trống = mặc định $0.50 kèm nhãn mặc định', async () => {
    expect(await listFamilyExtractionCaps(deps(null).d)).toEqual([
      {
        familyId: 'f1',
        familyName: 'Nhà A',
        month: '2026-10',
        capUsd: 0.5,
        capIsDefault: true,
        spentUsd: 0.21,
      },
    ]);
  });

  it('TC-307: nâng trần hiệu lực (mặc định 0.50 → 1.00) thì yêu cầu đưa lại hàng đợi đúng một lần', async () => {
    const { d, state } = deps(null);
    expect(await setFamilyExtractionCap(d, 'f1', 1)).toMatchObject({ capUsd: 1, capIsDefault: false });
    expect(state.requeued).toBe(1);
  });

  it('hạ trần hoặc giữ nguyên trần hiệu lực (0.50 → mặc định 0.50) không đưa lại hàng đợi', async () => {
    const lower = deps(1);
    expect(await setFamilyExtractionCap(lower.d, 'f1', 0.2)).toMatchObject({ capUsd: 0.2 });
    expect(lower.state.requeued).toBe(0);
    const same = deps(0.5);
    expect(await setFamilyExtractionCap(same.d, 'f1', null)).toMatchObject({
      capUsd: 0.5,
      capIsDefault: true,
    });
    expect(same.state.requeued).toBe(0);
  });

  it('gia đình không tồn tại → null', async () => {
    const { d, state } = deps(null);
    state.exists = false;
    expect(await setFamilyExtractionCap(d, 'f1', 1)).toBeNull();
  });
});
