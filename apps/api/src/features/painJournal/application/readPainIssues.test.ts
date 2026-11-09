import { describe, expect, it } from 'vitest';
import { listPainIssues } from './listPainIssues.js';
import { getPainIssue } from './getPainIssue.js';
import { getPainIssueDeletionImpact } from './getPainIssueDeletionImpact.js';
import { detail, painIssueFixture, summary, target } from './painIssueTestFixture.js';

describe('Đọc vấn đề đau — SPEC-053/055', () => {
  it('TC-669: mặc định all, tracking trước rồi theo thời điểm thực giảm dần', async () => {
    const { repository, store } = painIssueFixture();
    store.listIssues.mockResolvedValue([
      { ...summary, id: 'resolved', status: 'resolved', resolvedOn: '2026-11-06' },
      { ...summary, id: 'older', lastEntry: { level: 1, recordedAt: '2026-11-06T00:00:00+07:00' } },
      { ...summary, id: 'newer', lastEntry: { level: 2, recordedAt: '2026-11-05T18:00:00Z' } },
    ]);
    const result = await listPainIssues(repository, target, {});
    expect(result.ok && result.value.issues.map((value) => value.id)).toEqual(['newer', 'older', 'resolved']);
    expect(store.listIssues).toHaveBeenCalledWith(target.profileId, 'all');
  });

  it.each(['tracking', 'resolved'] as const)('TC-669: truyền đúng bộ lọc %s', async (status) => {
    const { repository, store } = painIssueFixture();
    await listPainIssues(repository, target, { status });
    expect(store.listIssues).toHaveBeenCalledWith(target.profileId, status);
  });

  it('TC-669: không đọc danh sách khi bộ lọc sai', async () => {
    const { repository, store } = painIssueFixture();
    expect(await listPainIssues(repository, target, { status: 'foo' })).toMatchObject({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(store.listIssues).not.toHaveBeenCalled();
  });

  it('TC-670: sắp lần ghi, bài tập và sự kiện cũ nhất trước', async () => {
    const { repository, store } = painIssueFixture();
    const audit = { createdBy: null, updatedBy: null, updatedAt: summary.updatedAt };
    store.getDetail.mockResolvedValue({
      ...detail,
      entries: [
        { ...detail.entries[0]!, id: 'late', recordedAt: '2026-11-05T18:00:00Z' },
        detail.entries[0]!,
      ],
      exercises: [
        {
          id: 'late',
          name: 'Duỗi gối',
          source: 'self',
          prescriber: null,
          startDate: '2026-11-06',
          endDate: null,
          note: null,
          ...audit,
        },
        {
          id: 'early',
          name: 'Duỗi gối',
          source: 'self',
          prescriber: null,
          startDate: '2026-11-05',
          endDate: null,
          note: null,
          ...audit,
        },
      ],
      statusEvents: [
        { kind: 'reopened', on: '2026-11-06', by: null, at: '2026-11-05T18:00:00Z' },
        { kind: 'resolved', on: '2026-11-06', by: null, at: '2026-11-05T17:00:00Z' },
      ],
    });
    const result = await getPainIssue(repository, target);
    expect(result.ok && result.value.entries.map((entry) => entry.id)).toEqual(['entry-1', 'late']);
    expect(result.ok && result.value.exercises.map((exercise) => exercise.id)).toEqual(['early', 'late']);
    expect(result.ok && result.value.statusEvents.map((event) => event.kind)).toEqual([
      'resolved',
      'reopened',
    ]);
  });

  it('TC-673: chỉ trả trường DTO, kể cả người ghi và bản ghi con', async () => {
    const { repository, store } = painIssueFixture();
    const extra = { trend: 'x', familyId: 'secret' };
    store.getDetail.mockResolvedValue({
      ...detail,
      ...extra,
      createdBy: { ...summary.createdBy!, ...extra },
      lastEntry: { ...summary.lastEntry, ...extra },
      entries: [{ ...detail.entries[0]!, ...extra }],
    });
    expect(await getPainIssue(repository, target)).toEqual({ ok: true, value: detail });
    store.listIssues.mockResolvedValue([{ ...summary, ...extra }]);
    expect(await listPainIssues(repository, target, {})).toEqual({ ok: true, value: { issues: [summary] } });
  });

  it('TC-674: giữ người ghi null khi tài khoản đã xóa', async () => {
    const { repository, store } = painIssueFixture();
    const value = { ...detail, createdBy: null, entries: [{ ...detail.entries[0]!, createdBy: null }] };
    store.getDetail.mockResolvedValue(value);
    expect(await getPainIssue(repository, target)).toEqual({ ok: true, value });
  });

  it('TC-687: tác động xóa chỉ trả hai số đếm', async () => {
    const { repository, store } = painIssueFixture();
    const impact = { entryCount: 5, exerciseCount: 2, secret: 'x' };
    store.countImpact.mockResolvedValue(impact);
    expect(await getPainIssueDeletionImpact(repository, target)).toEqual({
      ok: true,
      value: { entryCount: 5, exerciseCount: 2 },
    });
  });

  it.each(['list', 'detail', 'impact'])('TC-691: đọc %s không tự đóng vấn đề cũ mức 1', async (kind) => {
    const { repository, store } = painIssueFixture();
    const old = { ...summary, lastEntry: { level: 1, recordedAt: '2026-07-08T00:00:00Z' } };
    store.listIssues.mockResolvedValue([old]);
    store.getDetail.mockResolvedValue({ ...detail, ...old });
    const before = structuredClone(old);
    const result =
      kind === 'list'
        ? await listPainIssues(repository, target, {})
        : kind === 'detail'
          ? await getPainIssue(repository, target)
          : await getPainIssueDeletionImpact(repository, target);
    expect(result.ok).toBe(true);
    if (result.ok && 'issues' in result.value) {
      expect(result.value.issues[0]?.status).toBe('tracking');
      expect(result.value.issues[0]?.resolvedOn).toBeNull();
    }
    if (result.ok && 'status' in result.value) {
      expect(result.value).toMatchObject({ status: 'tracking', resolvedOn: null });
    }
    expect(old).toEqual(before);
    expect(store.insertIssue).not.toHaveBeenCalled();
    expect(store.updateIssue).not.toHaveBeenCalled();
    expect(store.changeStatus).not.toHaveBeenCalled();
    expect(store.deleteIssue).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/trend|severity|color|suggest/);
  });
});
