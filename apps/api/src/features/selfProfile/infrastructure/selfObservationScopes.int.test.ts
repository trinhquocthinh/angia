import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedSelfProfileData } from '@src/shared/test/seedSelfProfileData.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createSelfProfileRepository } from './createSelfProfileRepository.js';

describe('SPEC-042: RLS của hai nguồn tự xem E15', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-565: bốn repository tự xem đọc được hồ sơ khi policy chặn ghi bảng cũ', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const mother = await seedSelfProfileData(t, main, familyId, 'Mẹ');
    const scope = createSelfProfileRepository(t.database).forProfile(mother.profile.id);
    for (const repository of [scope.medications, scope.revisits, scope.asNeededDoses, scope.temperatures]) {
      expect(
        await repository.withFamily(familyId, (store) => store.findProfile(mother.profile.id)),
      ).toMatchObject({ consentStatus: 'confirmed' });
    }
  });

  it('TC-567: bỏ lọc hồ sơ của phiên ở application, hai bảng vẫn chặn hồ sơ Ba', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const mother = await seedSelfProfileData(t, main, familyId, 'Mẹ');
    const father = await seedSelfProfileData(t, main, familyId, 'Ba');
    const scope = createSelfProfileRepository(t.database).forProfile(mother.profile.id);
    const range = { from: new Date('2000-01-01'), to: new Date('2100-01-01') };
    // Truy vấn trực tiếp store để cả findProfile/consentGate không thể che mất lỗi RLS.
    const temperatures = (id: string) =>
      scope.temperatures.withFamily(familyId, (store) => store.listReadings(id, range));
    const doses = (id: string) =>
      scope.asNeededDoses.withFamily(familyId, (store) => store.listDoses(id, range));
    expect(await temperatures(mother.profile.id)).toEqual([
      expect.objectContaining({ id: mother.marker.temperature }),
    ]);
    expect(await doses(mother.profile.id)).toEqual([expect.objectContaining({ id: mother.marker.dose })]);
    expect(await temperatures(father.profile.id)).toEqual([]);
    expect(await doses(father.profile.id)).toEqual([]);
  });
});
