import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { painIssueDetailSchema } from '@angia/contracts';
import {
  painNow,
  painRepositoryFixture,
  unwrapPain,
  type PainRepositoryFixture,
} from './painRepositoryFixture.js';
import { createPainEntry } from '../application/createPainEntry.js';
import { updatePainEntry } from '../application/updatePainEntry.js';
import { createExerciseNote } from '../application/createExerciseNote.js';
import { updateExerciseNote } from '../application/updateExerciseNote.js';
import { deleteExerciseNote } from '../application/deleteExerciseNote.js';
import { resolvePainIssue } from '../application/resolvePainIssue.js';
import { reopenPainIssue } from '../application/reopenPainIssue.js';
import { updatePainIssue } from '../application/updatePainIssue.js';
import { getPainIssue } from '../application/getPainIssue.js';
import { listPainIssues } from '../application/listPainIssues.js';
import { deletePainIssue } from '../application/deletePainIssue.js';

describe('Đọc ghi repository sổ đau nhức', () => {
  let t: PainRepositoryFixture;
  beforeAll(async () => {
    t = await painRepositoryFixture();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-660/676/680/688: CRUD giữ người tạo, trả DTO hợp lệ, sự kiện và cascade nguyên tử', async () => {
    const session = await t.profile();
    const issue = await t.open(session);
    const editor = await t.profile(session.familyId);
    const target = { ...session, accountId: editor.accountId, issueId: issue.id };
    const entryTarget = { ...target, entryId: issue.entries[0]!.id };
    const edited = unwrapPain(await updatePainEntry(t.repository, entryTarget, { level: 3 }, painNow));
    expect(edited.createdBy?.accountId).toBe(session.accountId);
    expect(edited.updatedBy?.accountId).toBe(editor.accountId);
    expect(edited.updatedAt).toBe(painNow().toISOString());
    const exercise = unwrapPain(
      await createExerciseNote(
        t.repository,
        target,
        {
          name: 'Duỗi gối',
          source: 'prescribed',
          prescriber: 'BS. An',
          startDate: '2026-11-05',
        },
        painNow,
      ),
    );
    const updated = unwrapPain(
      await updateExerciseNote(
        t.repository,
        { ...target, exerciseId: exercise.id },
        { source: 'self' },
        painNow,
      ),
    );
    expect(updated.prescriber).toBeNull();
    unwrapPain(await resolvePainIssue(t.repository, target, { resolvedOn: '2026-11-06' }, painNow));
    unwrapPain(await reopenPainIssue(t.repository, target, {}, painNow));
    const detail = unwrapPain(await getPainIssue(t.repository, target));
    expect(painIssueDetailSchema.parse(detail)).toEqual(detail);
    expect(detail.createdBy?.accountId).toBe(session.accountId);
    expect(detail.updatedBy?.accountId).toBe(editor.accountId);
    expect(detail.statusEvents.map((e) => e.kind)).toEqual(['resolved', 'reopened']);
    expect(detail.statusEvents.every((e) => e.by?.accountId === editor.accountId)).toBe(true);
    unwrapPain(await deleteExerciseNote(t.repository, { ...target, exerciseId: exercise.id }));
    unwrapPain(
      await createExerciseNote(
        t.repository,
        target,
        {
          name: 'Bài tập',
          source: 'self',
          startDate: '2026-11-06',
        },
        painNow,
      ),
    );
    unwrapPain(await deletePainIssue(t.repository, target, { confirm: true }));
    for (const table of ['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events']) {
      expect(
        (await t.owner.query(`SELECT id FROM ${table} WHERE health_profile_id=$1`, [session.profileId])).rows,
      ).toEqual([]);
    }
  });

  it('TC-668/669: sắp xếp tracking trước, lần ghi cũ trước và lọc trạng thái', async () => {
    const session = await t.profile();
    const first = await t.open(session);
    const second = await t.open(session, 'right');
    const target = { ...session, issueId: second.id };
    unwrapPain(
      await createPainEntry(t.repository, target, { level: 2, recordedAt: '2026-11-04T01:00:00Z' }, painNow),
    );
    unwrapPain(await resolvePainIssue(t.repository, target, { resolvedOn: '2026-11-06' }, painNow));
    const all = unwrapPain(await listPainIssues(t.repository, session, { status: 'all' }));
    expect(all.issues.map((i) => i.id)).toEqual([first.id, second.id]);
    expect(
      unwrapPain(await listPainIssues(t.repository, session, { status: 'resolved' })).issues.map((i) => i.id),
    ).toEqual([second.id]);
    const detail = unwrapPain(await getPainIssue(t.repository, target));
    expect(detail.entries.map((e) => e.level)).toEqual([2, 6]);
    expect(detail.lastEntry.level).toBe(6);
    expect(detail.entryCount).toBe(2);
  });

  it('vi phạm unique khi sửa/mở lại rollback savepoint, giữ audit và không thêm sự kiện', async () => {
    const session = await t.profile();
    const left = await t.open(session);
    const right = await t.open(session, 'right');
    const audit = { accountId: session.accountId, at: painNow() };
    await t.repository.withFamily(session.familyId, async (store) => {
      await store.findIssue(session.profileId, right.id, true);
      expect(
        await store.updateIssue(
          session.profileId,
          right.id,
          { region: 'knee', side: 'left', title: 'Trùng' },
          audit,
        ),
      ).toEqual({ ok: false, code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: left.id } });
      expect((await store.getDetail(session.profileId, right.id))?.title).toBeNull();
    });
    unwrapPain(
      await resolvePainIssue(
        t.repository,
        { ...session, issueId: right.id },
        { resolvedOn: '2026-11-06' },
        painNow,
      ),
    );
    unwrapPain(
      await updatePainIssue(t.repository, { ...session, issueId: right.id }, { side: 'left' }, painNow),
    );
    await t.repository.withFamily(session.familyId, async (store) => {
      await store.findIssue(session.profileId, right.id, true);
      expect(
        await store.changeStatus(session.profileId, right.id, {
          ...audit,
          status: 'tracking',
          resolvedOn: null,
          kind: 'reopened',
          on: '2026-11-06',
        }),
      ).toEqual({ ok: false, code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: left.id } });
      const detail = await store.getDetail(session.profileId, right.id);
      expect(detail?.status).toBe('resolved');
      expect(detail?.statusEvents).toHaveLength(1);
    });
  });

  it('lỗi DB khác được ném và rollback cả vấn đề lẫn lần ghi đầu', async () => {
    const session = await t.profile();
    await expect(
      t.repository.withFamily(session.familyId, (store) =>
        store.insertIssue({
          profileId: session.profileId,
          region: 'knee',
          side: 'left',
          title: null,
          accountId: randomUUID(),
          at: painNow(),
          firstEntry: { level: 5, recordedAt: painNow().toISOString(), note: null },
        }),
      ),
    ).rejects.toThrow();
    await expect(
      t.repository.withFamily(session.familyId, (store) =>
        store.insertIssue({
          profileId: session.profileId,
          region: 'knee',
          side: 'left',
          title: null,
          accountId: session.accountId,
          at: painNow(),
          firstEntry: { level: 0, recordedAt: painNow().toISOString(), note: null },
        }),
      ),
    ).rejects.toThrow();
    expect(
      (await t.owner.query('SELECT id FROM pain_issues WHERE health_profile_id=$1', [session.profileId]))
        .rows,
    ).toEqual([]);
  });

  it('xóa tài khoản giữ dữ liệu và trả ActorRef null', async () => {
    const session = await t.profile();
    const issue = await t.open(session);
    await t.owner.query(
      "UPDATE health_profiles SET consent_source='invitation',consent_confirmed_by=NULL WHERE id=$1",
      [session.profileId],
    );
    await t.owner.query('DELETE FROM accounts WHERE id=$1', [session.accountId]);
    const detail = unwrapPain(await getPainIssue(t.repository, { ...session, issueId: issue.id }));
    expect(detail.createdBy).toBeNull();
    expect(detail.entries[0]!.updatedBy).toBeNull();
  });

  it('gỡ tài khoản khỏi gia đình vẫn giữ ActorRef lịch sử khi tài khoản còn tồn tại', async () => {
    const session = await t.profile();
    const issue = await t.open(session);
    await t.owner.query('UPDATE accounts SET family_id=NULL,family_role=NULL WHERE id=$1', [
      session.accountId,
    ]);
    const detail = unwrapPain(await getPainIssue(t.repository, { ...session, issueId: issue.id }));
    expect(detail.createdBy).toEqual({ accountId: session.accountId, displayName: 'Người ghi' });
    expect(detail.entries[0]!.updatedBy).toEqual(detail.createdBy);
  });
});
