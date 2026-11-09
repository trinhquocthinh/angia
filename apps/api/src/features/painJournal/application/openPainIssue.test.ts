import { describe, expect, it, vi } from 'vitest';
import { openPainIssue } from './openPainIssue.js';
import { detail, now, painIssueFixture, session } from './painIssueTestFixture.js';

const body = { region: 'knee', side: 'left', firstEntry: { level: 6 } };

describe('Mở vấn đề đau — SPEC-052', () => {
  it('TC-660: tạo vấn đề và lần ghi đầu cùng audit từ phiên, lấy đồng hồ đúng một lần', async () => {
    const { repository, store } = painIssueFixture();
    const clock = vi.fn(now);
    expect(await openPainIssue(repository, session, body, clock)).toEqual({ ok: true, value: detail });
    expect(store.insertIssue).toHaveBeenCalledWith({
      profileId: session.profileId,
      region: 'knee',
      side: 'left',
      title: null,
      firstEntry: { level: 6, recordedAt: '2026-11-05T17:30:00.000Z', note: null },
      accountId: session.accountId,
      at: now(),
    });
    expect(clock).toHaveBeenCalledTimes(1);
  });

  it('TC-661: trả ID xung đột mà không tạo dữ liệu', async () => {
    const { repository, store } = painIssueFixture();
    store.findTrackingIssue.mockResolvedValue('existing');
    expect(await openPainIssue(repository, session, body, now)).toEqual({
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'existing' },
    });
    expect(store.insertIssue).not.toHaveBeenCalled();
  });

  it('TC-663: giữ nguyên xung đột được repository phát hiện khi ghi', async () => {
    const { repository, store } = painIssueFixture();
    const conflict = {
      ok: false,
      code: 'ERR_PAIN_ISSUE_EXISTS',
      details: { existingIssueId: 'race' },
    } as const;
    store.insertIssue.mockResolvedValue(conflict);
    expect(await openPainIssue(repository, session, body, now)).toEqual(conflict);
  });

  it.each([0, 11, 5.5, '6'])('TC-664: không ghi khi mức đau sai %s', async (level) => {
    const { repository, store } = painIssueFixture();
    expect(await openPainIssue(repository, session, { ...body, firstEntry: { level } }, now)).toMatchObject({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(store.insertIssue).not.toHaveBeenCalled();
  });

  it('TC-664: từ chối tương lai trước khi kiểm xung đột trạng thái', async () => {
    const { repository, store } = painIssueFixture();
    store.findTrackingIssue.mockResolvedValue('existing');
    expect(
      await openPainIssue(
        repository,
        session,
        {
          ...body,
          firstEntry: { level: 6, recordedAt: '2026-11-06T00:31:00+07:00' },
        },
        now,
      ),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(store.insertIssue).not.toHaveBeenCalled();
  });

  it.each(['pending', 'withdrawn'] as const)(
    'TC-665: consent %s được kiểm trước body',
    async (consentStatus) => {
      const { repository, store } = painIssueFixture();
      store.findProfile.mockResolvedValue({ consentStatus });
      expect(await openPainIssue(repository, session, null, now)).toEqual({
        ok: false,
        code: 'ERR_CONSENT_REQUIRED',
      });
      expect(store.insertIssue).not.toHaveBeenCalled();
    },
  );

  it('TC-666: hồ sơ không thấy được trả NOT_FOUND trước body', async () => {
    const { repository, store } = painIssueFixture();
    store.findProfile.mockResolvedValue(null);
    expect(await openPainIssue(repository, session, null, now)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });

  it.each(['createdBy', 'updatedBy', 'accountId', 'healthProfileId', 'status'])(
    'TC-668: không nhận trường %s do client gửi',
    async (key) => {
      const { repository, store } = painIssueFixture();
      expect(await openPainIssue(repository, session, { ...body, [key]: 'spoof' }, now)).toMatchObject({
        ok: false,
        code: 'ERR_VALIDATION',
      });
      expect(store.insertIssue).not.toHaveBeenCalled();
    },
  );

  it('TC-667: trim ghi chú rỗng thành null và giữ thời điểm hồi tố', async () => {
    const { repository, store } = painIssueFixture();
    await openPainIssue(
      repository,
      session,
      {
        ...body,
        title: 'Đầu gối',
        firstEntry: { level: 6, recordedAt: '2026-10-01T00:00:00+07:00', note: '  ' },
      },
      now,
    );
    expect(store.insertIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Đầu gối',
        firstEntry: { level: 6, recordedAt: '2026-10-01T00:00:00+07:00', note: null },
      }),
    );
  });
});
