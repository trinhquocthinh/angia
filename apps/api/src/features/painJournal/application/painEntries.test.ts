import { describe, expect, it } from 'vitest';
import { createPainEntry } from './createPainEntry.js';
import { updatePainEntry } from './updatePainEntry.js';
import { deletePainEntry } from './deletePainEntry.js';
import { entry, issue, now, painIssueFixture, session, summary } from './painIssueTestFixture.js';

const child = { ...session, entryId: 'entry-1' };
const audit = { accountId: session.accountId, at: now() };

describe('Application lần ghi đau — SPEC-054', () => {
  it('TC-676: tạo lần ghi dùng giờ server, người ghi từ phiên và khóa vấn đề', async () => {
    const { repository, store } = painIssueFixture();
    expect(await createPainEntry(repository, session, { level: 4 }, now)).toEqual({ ok: true, value: entry });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.insertEntry).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      { level: 4, recordedAt: '2026-11-05T17:30:00.000Z', note: null },
      audit,
    );
  });

  it('TC-677: kiểm hợp đồng trước trạng thái và không tạo khi đã khỏi', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await createPainEntry(repository, session, { level: 0 }, now)).toMatchObject({
      code: 'ERR_VALIDATION',
    });
    expect(await createPainEntry(repository, session, { level: 4 }, now)).toEqual({
      ok: false,
      code: 'ERR_INVALID_STATE_TRANSITION',
    });
    expect(store.insertEntry).not.toHaveBeenCalled();
  });

  it.each([0, 11, 1.5])('TC-664: không ghi mức %s', async (level) => {
    const { repository, store } = painIssueFixture();
    expect(await createPainEntry(repository, session, { level }, now)).toMatchObject({
      code: 'ERR_VALIDATION',
    });
    expect(store.insertEntry).not.toHaveBeenCalled();
  });

  it('TC-683: không ghi thời điểm tương lai', async () => {
    const { repository, store } = painIssueFixture();
    expect(
      await createPainEntry(repository, session, { level: 4, recordedAt: '2026-11-05T17:31:00Z' }, now),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(store.insertEntry).not.toHaveBeenCalled();
  });

  it('TC-680: PATCH giữ trường bỏ trống, ghi chú rỗng thành null và audit lấy từ phiên', async () => {
    const { repository, store } = painIssueFixture();
    store.findEntry.mockResolvedValue({ ...entry, note: 'Cũ', createdBy: null });
    store.updateEntry.mockResolvedValue({ ...entry, createdBy: null });
    expect(await updatePainEntry(repository, child, { level: 7, note: '  ' }, now)).toEqual({
      ok: true,
      value: { ...entry, createdBy: null },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      child.entryId,
      { level: 7, recordedAt: entry.recordedAt, note: null },
      audit,
    );
  });

  it('TC-681: PATCH ghép dữ liệu cũ, kiểm cuối ngày khỏi theo giờ VN', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-05' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(
      await updatePainEntry(repository, child, { recordedAt: '2026-11-05T23:59:00+07:00' }, now),
    ).toMatchObject({ ok: true });
    store.updateEntry.mockClear();
    expect(
      await updatePainEntry(repository, child, { recordedAt: '2026-11-06T00:00:00+07:00' }, now),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(store.updateEntry).not.toHaveBeenCalled();
  });

  it('TC-678: chặn xóa lần ghi cuối, cho xóa khi còn nhiều lần ghi', async () => {
    const { repository, store } = painIssueFixture();
    store.countImpact.mockResolvedValue({ entryCount: 1, exerciseCount: 0 });
    expect(await deletePainEntry(repository, child)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { reason: 'last_entry' },
    });
    expect(store.deleteEntry).not.toHaveBeenCalled();
    store.countImpact.mockResolvedValue({ entryCount: 2, exerciseCount: 0 });
    expect(await deletePainEntry(repository, child)).toEqual({ ok: true, value: null });
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
    expect(store.deleteEntry).toHaveBeenCalledWith(session.profileId, session.issueId, child.entryId);
  });
});
