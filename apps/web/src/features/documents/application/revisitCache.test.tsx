import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { ReviewRepository } from './reviewPorts';
import { useApproveDocument, useCreateManualRecords } from './useReviewWorkspace';
import { invalidateDeletedDocument } from './invalidateDeletedDocument';
const session = {
  account: { id: 'a' },
  family: { id: 'f' },
  role: 'main',
  csrfToken: 'csrf',
} as ProfileSession;
describe('TC-573/474 — cache lịch sau thay đổi đơn', () => {
  it.each(['approve', 'manual', 'delete'])(
    '%s làm mới lịch và chi tiết thông báo trong phiên',
    async (action) => {
      const client = new QueryClient();
      const key = ['revisits', 'a', 'f', 'p'];
      const detail = ['my-revisit-reminder', 'a', 'f', 'id'];
      const other = ['revisits', 'other', 'f', 'p'];
      for (const k of [key, detail, other]) client.setQueryData(k, []);
      const repo = {
        approve: async () => ({}),
        createManualRecords: async () => ({}),
      } as unknown as ReviewRepository;
      let approve: ReturnType<typeof useApproveDocument>;
      let manual: ReturnType<typeof useCreateManualRecords>;
      function Probe() {
        approve = useApproveDocument(repo, session, 'd');
        manual = useCreateManualRecords(repo, session, 'p');
        return null;
      }
      renderToStaticMarkup(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
      if (action === 'delete') await invalidateDeletedDocument(client, session, 'd', 'p');
      else
        await (action === 'approve' ? approve! : manual!).mutateAsync({
          type: 'prescription',
          data: {},
        } as never);
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
      expect(client.getQueryState(detail)?.isInvalidated).toBe(true);
      expect(client.getQueryState(other)?.isInvalidated).toBe(false);
      client.clear();
    },
  );
});
