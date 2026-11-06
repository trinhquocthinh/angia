import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  painNow,
  painRepositoryFixture,
  unwrapPain,
  type PainRepositoryFixture,
} from './painRepositoryFixture.js';
import { openPainIssue } from '../application/openPainIssue.js';
import { createPainEntry } from '../application/createPainEntry.js';
import { deletePainEntry } from '../application/deletePainEntry.js';
import type { PainIssueRepository } from '../application/ports.js';
import { resolvePainIssue } from '../application/resolvePainIssue.js';
import { waitForPainLocks } from './waitForPainLocks.js';

describe('Đồng thời repository sổ đau nhức', () => {
  let t: PainRepositoryFixture;
  beforeAll(async () => {
    t = await painRepositoryFixture();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-663: hai lần mở cùng vượt kiểm tra trước, chỉ một lần commit và trả ID xung đột', async () => {
    const session = await t.profile();
    let arrivals = 0;
    let release!: () => void;
    const bothRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    const repository: PainIssueRepository = {
      withFamily: (familyId, work) =>
        t.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            findTrackingIssue: async (...args) => {
              const found = await store.findTrackingIssue(...args);
              if (++arrivals === 2) release();
              await bothRead;
              return found;
            },
          }),
        ),
    };
    const body = { region: 'knee', side: 'left', firstEntry: { level: 6 } };
    const results = await Promise.all([
      openPainIssue(repository, session, body, painNow),
      openPainIssue(repository, session, body, painNow),
    ]);
    const winner = results.find((r) => r.ok)!;
    expect(winner.ok).toBe(true);
    if (!winner.ok) throw new Error('Thiếu kết quả thành công');
    expect(results.find((r) => !r.ok)).toEqual({
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: winner.value.id },
    });
    for (const table of ['pain_issues', 'pain_entries']) {
      expect(
        (await t.owner.query(`SELECT id FROM ${table} WHERE health_profile_id=$1`, [session.profileId]))
          .rowCount,
      ).toBe(1);
    }
  });

  it('TC-679: xóa đồng thời hai lần ghi cuối chỉ xóa được một lần', async () => {
    const session = await t.profile();
    const issue = await t.open(session);
    const target = { ...session, issueId: issue.id };
    const second = unwrapPain(await createPainEntry(t.repository, target, { level: 4 }, painNow));
    const blocker = await t.pool.connect();
    await blocker.query('BEGIN');
    await blocker.query("SELECT set_config('app.family_id',$1,true)", [session.familyId]);
    await blocker.query('SELECT id FROM pain_issues WHERE id=$1 FOR UPDATE', [issue.id]);
    const pending = Promise.all(
      [issue.entries[0]!.id, second.id].map((entryId) =>
        deletePainEntry(t.repository, { ...target, entryId }),
      ),
    );
    try {
      await waitForPainLocks(t.owner, 2);
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
    }
    const results = await pending;
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { reason: 'last_entry' },
    });
    expect(
      (await t.owner.query('SELECT id FROM pain_entries WHERE pain_issue_id=$1', [issue.id])).rowCount,
    ).toBe(1);
  });

  it('TC-684: đóng vấn đề đọc lại lần ghi muộn nhất sau khi chờ khóa của lệnh thêm', async () => {
    const session = await t.profile();
    const issue = await t.open(session);
    let inserted!: () => void;
    const ready = new Promise<void>((resolve) => {
      inserted = resolve;
    });
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const writer = t.repository.withFamily(session.familyId, async (store) => {
      await store.findIssue(session.profileId, issue.id, true);
      await store.insertEntry(
        session.profileId,
        issue.id,
        {
          level: 4,
          recordedAt: '2026-11-06T18:00:00.000Z',
          note: null,
        },
        { accountId: session.accountId, at: new Date('2026-11-07T01:00:00Z') },
      );
      inserted();
      await held;
    });
    await ready;
    const closing = resolvePainIssue(
      t.repository,
      { ...session, issueId: issue.id },
      { resolvedOn: '2026-11-06' },
      () => new Date('2026-11-08T00:00:00Z'),
    );
    try {
      await waitForPainLocks(t.owner, 1);
    } finally {
      release();
    }
    await writer;
    expect(await closing).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    const [row] = (await t.owner.query('SELECT status FROM pain_issues WHERE id=$1', [issue.id])).rows;
    expect(row.status).toBe('tracking');
  });
});
