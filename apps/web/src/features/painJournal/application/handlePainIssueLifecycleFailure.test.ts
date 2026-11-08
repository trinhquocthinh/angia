import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { handlePainIssueLifecycleFailure } from './handlePainIssueLifecycleFailure';
import { PainJournalRequestError } from './PainJournalRequestError';
import { session } from '../test/painIssues.test-helper';
it('TC-685: lỗi trùng vùng giữ mã vấn đề để mở, lỗi quyền làm mới phạm vi', async () => {
  const client = new QueryClient();
  const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'detail', 'issue'];
  client.setQueryData(key, {});
  expect(
    await handlePainIssueLifecycleFailure(
      client,
      session,
      'p',
      new PainJournalRequestError('Trùng', 409, 'ERR_PAIN_ISSUE_EXISTS', 'other'),
    ),
  ).toEqual({ error: 'Vùng này đang có một vấn đề khác đang theo dõi.', existingIssueId: 'other' });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(await handlePainIssueLifecycleFailure(client, session, 'p', new Error('Mạng'))).toEqual({
    error: 'Không thể cập nhật vấn đề đau. Vui lòng thử lại.',
    existingIssueId: null,
  });
  client.clear();
});
