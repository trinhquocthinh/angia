import { describe, expect, it, vi } from 'vitest';
import { issue } from '../test/painIssues.test-helper';
import { PainJournalRequestError } from './PainJournalRequestError';
import { submitNewPainIssue } from './submitNewPainIssue';
import { findTrackingPainIssue } from './findTrackingPainIssue';

const request = {
  region: 'knee' as const,
  side: 'left' as const,
  firstEntry: { level: 6, note: 'Sau đi bộ' },
};
const detail = { ...issue, entries: [], exercises: [], statusEvents: [] };
describe('E21-S2-T2 — mở vấn đề và bàn giao bản nháp', () => {
  it('TC-722 — tìm đúng vùng/bên đang theo dõi, bỏ qua vấn đề đã khỏi', () => {
    const resolved = { ...issue, status: 'resolved' as const };
    expect(findTrackingPainIssue([resolved, issue], request)).toEqual(issue);
    expect(findTrackingPainIssue([resolved], request)).toBeUndefined();
    expect(findTrackingPainIssue([issue], { region: 'knee', side: 'right' })).toBeUndefined();
  });
  it('tạo vấn đề cùng lần ghi đầu và bàn giao ID đã tạo', async () => {
    const create = vi.fn(async () => detail);
    const signal = new AbortController().signal;
    expect(await submitNewPainIssue({ create }, 'p', request, 'csrf', signal)).toEqual({
      kind: 'created',
      issueId: issue.id,
    });
    expect(create).toHaveBeenCalledWith('p', request, 'csrf', signal);
  });
  it('TC-728 — 409 giữ mức 6 và toàn bộ lần ghi, không tự ghi thêm', async () => {
    const create = vi.fn(async () => {
      throw new PainJournalRequestError('Trùng vùng', 409, 'ERR_PAIN_ISSUE_EXISTS', issue.id);
    });
    const result = await submitNewPainIssue({ create }, null, request, 'csrf');
    expect(result).toEqual({
      kind: 'existing',
      issueId: issue.id,
      draft: request.firstEntry,
      message: 'Vùng này đang có vấn đề đang theo dõi. Mức bạn chấm sẽ được ghi vào vấn đề đó.',
    });
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('không nuốt lỗi đồng thuận, lỗi mạng hoặc 409 thiếu ID hợp lệ', async () => {
    for (const error of [
      new Error('Mạng'),
      new PainJournalRequestError('Đồng thuận', 409, 'ERR_CONSENT_REQUIRED'),
      new PainJournalRequestError('Trùng vùng', 409, 'ERR_PAIN_ISSUE_EXISTS'),
    ]) {
      await expect(
        submitNewPainIssue(
          {
            create: async () => {
              throw error;
            },
          },
          'p',
          request,
          'csrf',
        ),
      ).rejects.toBe(error);
    }
  });
  it('chặn dữ liệu sai trước khi gửi API', async () => {
    const create = vi.fn(async () => detail);
    await expect(
      submitNewPainIssue({ create }, 'p', { ...request, firstEntry: { level: 0 } }, 'csrf'),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});
