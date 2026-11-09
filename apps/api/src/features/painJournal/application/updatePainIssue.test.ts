import { describe, expect, it } from 'vitest';
import { updatePainIssue } from './updatePainIssue.js';
import { issue, now, painIssueFixture, session, summary } from './painIssueTestFixture.js';

describe('Sửa vấn đề đau — SPEC-055', () => {
  it('TC-689: đổi tiêu đề giữ vùng/bên và loại chính vấn đề khỏi kiểm trùng', async () => {
    const { repository, store } = painIssueFixture();
    store.updateIssue.mockResolvedValue({ ok: true, value: { ...summary, title: 'Đầu gối trái' } });
    expect(await updatePainIssue(repository, session, { title: 'Đầu gối trái' }, now)).toMatchObject({
      ok: true,
      value: { title: 'Đầu gối trái' },
    });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.findTrackingIssue).toHaveBeenCalledWith(
      session.profileId,
      { region: 'knee', side: 'left' },
      session.issueId,
    );
    expect(store.updateIssue).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      { region: 'knee', side: 'left', title: 'Đầu gối trái' },
      { accountId: session.accountId, at: now() },
    );
  });

  it.each([{ region: 'head' }, { side: 'center' }])(
    'TC-689: kiểm cặp vùng/bên sau ghép PATCH %j',
    async (body) => {
      const { repository, store } = painIssueFixture();
      expect(await updatePainIssue(repository, session, body, now)).toMatchObject({
        ok: false,
        code: 'ERR_VALIDATION',
        details: { fields: ['side'] },
      });
      expect(store.updateIssue).not.toHaveBeenCalled();
    },
  );

  it('TC-689: cho đổi đồng thời vùng và bên hợp lệ', async () => {
    const { repository, store } = painIssueFixture();
    await updatePainIssue(repository, session, { region: 'head', side: 'center' }, now);
    expect(store.updateIssue).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      { region: 'head', side: 'center', title: null },
      expect.anything(),
    );
  });

  it('TC-689: không đổi tracking sang vị trí đã có vấn đề khác', async () => {
    const { repository, store } = painIssueFixture();
    store.findTrackingIssue.mockResolvedValue('other-issue');
    expect(await updatePainIssue(repository, session, { side: 'right' }, now)).toEqual({
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'other-issue' },
    });
    expect(store.updateIssue).not.toHaveBeenCalled();
  });

  it('TC-689: resolved không chiếm vị trí tracking', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    store.findTrackingIssue.mockResolvedValue('other-issue');
    expect((await updatePainIssue(repository, session, { side: 'right' }, now)).ok).toBe(true);
    expect(store.findTrackingIssue).not.toHaveBeenCalled();
  });

  it('TC-689: giữ nguyên lỗi xung đột khi repository cập nhật', async () => {
    const { repository, store } = painIssueFixture();
    const conflict = {
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'race' },
    } as const;
    store.updateIssue.mockResolvedValue(conflict);
    expect(await updatePainIssue(repository, session, { side: 'right' }, now)).toEqual(conflict);
  });

  it('TC-668: không cho PATCH trạng thái hay audit', async () => {
    const { repository, store } = painIssueFixture();
    expect(
      await updatePainIssue(repository, session, { status: 'resolved', updatedBy: 'spoof' }, now),
    ).toMatchObject({ ok: false, code: 'ERR_VALIDATION' });
    expect(store.updateIssue).not.toHaveBeenCalled();
  });
});
