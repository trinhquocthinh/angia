import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { handleExerciseNoteFailure } from './handleExerciseNoteFailure';
import { session } from '../test/painIssues.test-helper';
it('TC-692: lỗi quyền làm mới quyền và dữ liệu, lỗi mạng giữ thông báo thử lại', async () => {
  const client = new QueryClient();
  const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'detail', 'issue'];
  client.setQueryData(key, {});
  expect(await handleExerciseNoteFailure(client, session, 'p', new Error('Mạng'))).toContain(
    'Vui lòng thử lại',
  );
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  expect(
    await handleExerciseNoteFailure(client, session, 'p', new MedicationRequestError('Cần đồng thuận', 409)),
  ).toBe('Cần đồng thuận');
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  client.clear();
});
