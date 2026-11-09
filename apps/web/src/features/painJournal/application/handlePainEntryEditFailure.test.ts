import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { session } from '../test/painIssues.test-helper';
import { PainJournalRequestError } from './PainJournalRequestError';
import { handlePainEntryEditFailure } from './handlePainEntryEditFailure';
it('lần ghi cuối làm mới dữ liệu, mất đồng thuận làm mới cả quyền', async () => {
  const client = new QueryClient();
  const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'all'];
  client.setQueryData(key, {});
  client.setQueryData(['current-session'], session);
  expect(
    await handlePainEntryEditFailure(
      client,
      session,
      'p',
      new PainJournalRequestError('Cuối', 422, 'ERR_VALIDATION', undefined, 'last_entry'),
    ),
  ).toEqual({
    lastEntry: true,
    error: 'Đây là lần ghi duy nhất. Muốn bỏ hẳn, hãy xóa vấn đề.',
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  await handlePainEntryEditFailure(
    client,
    session,
    'p',
    new PainJournalRequestError('Đồng thuận', 409, 'ERR_CONSENT_REQUIRED'),
  );
  expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  client.clear();
});
