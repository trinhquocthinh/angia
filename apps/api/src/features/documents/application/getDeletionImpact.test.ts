import { describe, expect, it } from 'vitest';
import type { DocumentDeletionImpact } from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { DeletionRepository, DeletionStore } from './deletionPorts.js';
import { getDeletionImpact } from './getDeletionImpact.js';

const impact: DocumentDeletionImpact = {
  prescriptions: 1,
  prescriptionItems: 2,
  labResults: 0,
  measurements: 0,
  medicationCourses: 3,
  activeMedicationCourses: 1,
};

function repository(found: { consent: ConsentStatus } | null, locks: boolean[]): DeletionRepository {
  const store = {
    findDocument: async (_id: string, lock: boolean) => {
      locks.push(lock);
      return found && { imageKey: null, profileConsentStatus: found.consent };
    },
    countImpact: async () => impact,
  } as unknown as DeletionStore;
  return { withFamily: (_familyId, work) => work(store) };
}

describe('Xem trước tác động xóa chứng từ (SPEC-037)', () => {
  it('TC-412: trả số đếm, đọc chứng từ không khóa', async () => {
    const locks: boolean[] = [];
    expect(await getDeletionImpact(repository({ consent: 'confirmed' }, locks), 'f', 'd')).toEqual({
      ok: true,
      value: impact,
    });
    expect(locks).toEqual([false]);
  });

  it('TC-413: không thấy → ERR_NOT_FOUND; rút đồng thuận → ERR_CONSENT_REQUIRED', async () => {
    expect(await getDeletionImpact(repository(null, []), 'f', 'd')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await getDeletionImpact(repository({ consent: 'withdrawn' }, []), 'f', 'd')).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});
