import { describe, expect, it, vi } from 'vitest';
import { resolvePainIssue } from './resolvePainIssue.js';
import { reopenPainIssue } from './reopenPainIssue.js';
import { deletePainIssue } from './deletePainIssue.js';
import { issue, now, painIssueFixture, session, summary } from './painIssueTestFixture.js';

describe('Đóng, mở lại và xóa vấn đề — SPEC-055', () => {
  it.each(['2026-11-06'])('TC-684: ngày khỏi %s và ngày lần ghi được quy đổi theo VN', async (resolvedOn) => {
    const { repository, store } = painIssueFixture();
    const clock = vi.fn(now);
    const value = { ...summary, status: 'resolved', resolvedOn } as const;
    store.changeStatus.mockResolvedValue({ ok: true, value });
    expect(await resolvePainIssue(repository, session, { resolvedOn }, clock)).toEqual({ ok: true, value });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.changeStatus).toHaveBeenCalledWith(session.profileId, session.issueId, {
      status: 'resolved',
      resolvedOn,
      kind: 'resolved',
      on: resolvedOn,
      accountId: session.accountId,
      at: now(),
    });
    expect(clock).toHaveBeenCalledTimes(1);
  });

  it.each(['2026-11-05', '2026-11-07', '2026-02-30'])(
    'TC-684: không đóng với ngày ngoài khoảng %s',
    async (resolvedOn) => {
      const { repository, store } = painIssueFixture();
      expect(await resolvePainIssue(repository, session, { resolvedOn }, now)).toMatchObject({
        ok: false,
        code: 'ERR_VALIDATION',
      });
      expect(store.changeStatus).not.toHaveBeenCalled();
    },
  );

  it('TC-684: biên dưới lấy lần ghi muộn nhất thay vì ngày hiện tại', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue,
      consentStatus: 'confirmed',
      lastRecordedAt: '2026-11-03T17:00:00Z',
    });
    expect((await resolvePainIssue(repository, session, { resolvedOn: '2026-11-04' }, now)).ok).toBe(true);
  });

  it('TC-686: không đóng vấn đề đã khỏi và không ghi sự kiện', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await resolvePainIssue(repository, session, { resolvedOn: '2026-11-06' }, now)).toEqual({
      ok: false,
      code: 'ERR_INVALID_STATE_TRANSITION',
    });
    expect(store.changeStatus).not.toHaveBeenCalled();
  });

  it('TC-686: không mở lại tracking kể cả đang có xung đột', async () => {
    const { repository, store } = painIssueFixture();
    store.findTrackingIssue.mockResolvedValue('other');
    expect(await reopenPainIssue(repository, session, {}, now)).toEqual({
      ok: false,
      code: 'ERR_INVALID_STATE_TRANSITION',
    });
    expect(store.changeStatus).not.toHaveBeenCalled();
  });

  it('TC-685: mở lại bị chặn khi vị trí đang được theo dõi', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    store.findTrackingIssue.mockResolvedValue('other');
    expect(await reopenPainIssue(repository, session, {}, now)).toEqual({
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'other' },
    });
    expect(store.changeStatus).not.toHaveBeenCalled();
  });

  it('TC-688: mở lại xóa ngày khỏi và ghi sự kiện đúng ngày VN, audit phiên', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await reopenPainIssue(repository, session, {}, now)).toEqual({ ok: true, value: summary });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.findTrackingIssue).toHaveBeenCalledWith(
      session.profileId,
      { region: 'knee', side: 'left' },
      session.issueId,
    );
    expect(store.changeStatus).toHaveBeenCalledWith(session.profileId, session.issueId, {
      status: 'tracking',
      resolvedOn: null,
      kind: 'reopened',
      on: '2026-11-06',
      accountId: session.accountId,
      at: now(),
    });
  });

  it('TC-685: truyền lỗi xung đột repository phát hiện khi mở lại', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    const conflict = {
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'race' },
    } as const;
    store.changeStatus.mockResolvedValue(conflict);
    expect(await reopenPainIssue(repository, session, {}, now)).toEqual(conflict);
  });

  it('TC-686: body sai được kiểm trước trạng thái', async () => {
    const { repository } = painIssueFixture();
    expect(await reopenPainIssue(repository, session, { status: 'tracking' }, now)).toMatchObject({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it.each([undefined, null, {}, { confirm: false }, { confirm: true, accountId: 'spoof' }])(
    'TC-690: không xóa khi xác nhận không hợp lệ %j',
    async (body) => {
      const { repository, store } = painIssueFixture();
      expect(await deletePainIssue(repository, session, body)).toMatchObject({
        ok: false,
        code: 'ERR_VALIDATION',
      });
      expect(store.deleteIssue).not.toHaveBeenCalled();
    },
  );

  it('TC-687: chỉ xóa đúng vấn đề sau xác nhận và khóa', async () => {
    const { repository, store } = painIssueFixture();
    expect(await deletePainIssue(repository, session, { confirm: true })).toEqual({ ok: true, value: null });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.deleteIssue).toHaveBeenCalledWith(session.profileId, session.issueId);
  });
});
