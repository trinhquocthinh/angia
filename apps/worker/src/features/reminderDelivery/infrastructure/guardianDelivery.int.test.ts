import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { createDeliveryRepository } from './createDeliveryRepository.js';
import { sendReminders } from '../application/sendReminders.js';
import { seedDeliveryFamily, fakeNotifier, plus } from './seedDeliveryFamily.test-helper.js';
const at = new Date('2026-10-23T00:00:00Z');
describe('SPEC-070: gửi nhắc theo giám hộ hiện hành', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  it('TC-809/811: fan-out chỉ giám hộ, lần gửi lại chặn người vừa tự gỡ', async () => {
    const f = await seedDeliveryFamily(fx.owner);
    const other = randomUUID();
    await fx.owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1,$2,'Bình',$3,'main')",
      [other, `sub-${other}`, f.familyId],
    );
    await fx.owner.query('UPDATE health_profiles SET birth_year=2020 WHERE id=$1', [f.profileId]);
    await fx.owner.query(
      'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [f.profileId, f.familyId, other],
    );
    const oldDevice = await f.addDevice();
    const guardianDevice = await f.addDevice(other);
    await f.addReminder(at);
    const repository = {
      ...createDeliveryRepository(fx.pool, randomUUID),
      listFamilyIds: async () => [f.familyId],
    };
    const fake = fakeNotifier(() => ({ kind: 'retry', code: 'network' }));
    await sendReminders(repository, fake.notifier, { now: () => at });
    expect(fake.callsTo(oldDevice.endpoint)).toHaveLength(0);
    expect(fake.callsTo(guardianDevice.endpoint)).toHaveLength(1);
    await fx.owner.query(
      'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
      [f.profileId, f.familyId, f.mainId],
    );
    await fx.owner.query('DELETE FROM profile_guardians WHERE health_profile_id=$1 AND account_id=$2', [
      f.profileId,
      other,
    ]);
    const second = await sendReminders(repository, fake.notifier, { now: () => plus(at, 1) });
    expect(fake.callsTo(guardianDevice.endpoint)).toHaveLength(1);
    expect(second.totals.revoked).toBe(1);
  });
});
