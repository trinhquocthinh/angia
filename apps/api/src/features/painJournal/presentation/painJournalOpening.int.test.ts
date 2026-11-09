import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { painIssueListSchema, type PainIssueDetail } from '@angia/contracts';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

describe.each([false, true])('Mở vấn đề đau qua HTTP, self=%s', (self) => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-660/697: tạo nguyên tử một lần ghi, giờ server và người ghi từ phiên', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    expect(issue.status).toBe('tracking');
    expect(issue.entryCount).toBe(1);
    expect(issue.entries).toHaveLength(1);
    expect(issue.entries[0]).toMatchObject({ level: 6, recordedAt: '2026-11-06T10:00:00.000Z' });
    for (const record of [issue, issue.entries[0]!]) {
      expect(record.createdBy?.accountId).toBe(s.user.accountId);
      expect(record.updatedBy).toEqual(record.createdBy);
    }
    expect(
      (await t.owner.query('SELECT health_profile_id FROM pain_issues WHERE id=$1', [issue.id])).rows,
    ).toEqual([{ health_profile_id: s.profileId }]);
  });

  it('TC-661/662: trùng vùng trả ID hiện có; đã đóng cho phép mở vấn đề mới', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    const before = await snapshotHealthTables(t.owner);
    const conflict = await s.send(
      'POST',
      '',
      { region: 'knee', side: 'left', firstEntry: { level: 5 } },
      409,
    );
    expect(await conflict.json()).toMatchObject({
      error: { code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: issue.id } },
    });
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    const next = await s.open();
    expect(next.id).not.toBe(issue.id);
    const response = await s.send('GET', '', undefined, 200);
    expect(painIssueListSchema.parse(await response.json()).issues.map((x) => x.status)).toEqual([
      'tracking',
      'resolved',
    ]);
  });

  it('TC-663: hai yêu cầu đồng thời trả một 201 và một 409, DB chỉ có một cặp vấn đề/lần ghi', async () => {
    const s = await painJournalScenario(t, self);
    const body = { region: 'knee', side: 'left', firstEntry: { level: 6 } };
    const responses = await Promise.all([
      t.call(s.user, 'POST', s.base, body),
      t.call(s.user, 'POST', s.base, body),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const winner = (await responses.find((r) => r.status === 201)!.json()) as PainIssueDetail;
    expect(await responses.find((r) => r.status === 409)!.json()).toMatchObject({
      error: { code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: winner.id } },
    });
    for (const table of ['pain_issues', 'pain_entries'])
      expect(
        (await t.owner.query(`SELECT id FROM ${table} WHERE health_profile_id=$1`, [s.profileId])).rowCount,
      ).toBe(1);
  });

  it('TC-664/668: từ chối mức/thời gian sai và mọi khóa ngoài hợp đồng, DB không đổi', async () => {
    const s = await painJournalScenario(t, self);
    const valid = { region: 'knee', side: 'left', firstEntry: { level: 6 } };
    const bodies = [
      ...[0, 11, 5.5, '6'].map((level) => ({ ...valid, firstEntry: { level } })),
      { ...valid, firstEntry: { level: 6, recordedAt: '2026-11-06T10:01:00Z' } },
      ...['createdBy', 'updatedBy', 'healthProfileId', 'status'].map((key) => ({
        ...valid,
        [key]: 'resolved',
      })),
    ];
    const before = await snapshotHealthTables(t.owner);
    for (const body of bodies) {
      const response = await s.send('POST', '', body, 422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(await snapshotHealthTables(t.owner)).toEqual(before);
    }
  });

  it('TC-665: pending và withdrawn đều chặn mở vấn đề trước validation', async () => {
    const s = await painJournalScenario(t, self);
    for (const status of ['pending', 'withdrawn']) {
      await t.owner.query(
        "UPDATE health_profiles SET consent_status=$2,consent_withdrawn_at=CASE WHEN $2='withdrawn' THEN now() ELSE NULL END WHERE id=$1",
        [s.profileId, status],
      );
      const before = await snapshotHealthTables(t.owner);
      const response = await s.send('POST', '', { firstEntry: { level: 99 } }, 409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
      expect(await snapshotHealthTables(t.owner)).toEqual(before);
    }
  });

  it('TC-666: cửa main không phân biệt hồ sơ gia đình khác và hồ sơ không tồn tại', async () => {
    const s = await painJournalScenario(t, self);
    const foreign = await t.profile();
    const before = await snapshotHealthTables(t.owner);
    const call = (id: string) =>
      t.call(s.main, 'POST', `/api/health-profiles/${id}/pain-issues`, {
        region: 'knee',
        side: 'left',
        firstEntry: { level: 6 },
      });
    await expectCrossFamilyDenied(
      () => call(foreign.profileId),
      () => call(randomUUID()),
    );
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
  });
});
