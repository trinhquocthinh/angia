import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { session } from '../test/painIssues.test-helper';
import { usePainEntryFailure } from './usePainEntryFailure';
import { PainJournalRequestError } from './PainJournalRequestError';

it('TC-723 — chỉ kiểm lại quyền cho lỗi truy cập, không cho lỗi trạng thái đã khỏi', async () => {
  const client = new QueryClient();
  let state!: ReturnType<typeof usePainEntryFailure>;
  function Probe() {
    state = usePainEntryFailure(session);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  client.setQueryData(['current-session'], session);
  await state.handleError(new PainJournalRequestError('Đã khỏi', 409, 'ERR_INVALID_STATE_TRANSITION'));
  expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(false);
  await state.handleError(new PainJournalRequestError('Hết quyền', 403, 'ERR_FORBIDDEN'));
  expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  client.clear();
});
