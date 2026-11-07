import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../../test/painIssues.test-helper';
import { DeletePainIssueDialog } from './DeletePainIssueDialog';
it('TC-727: số tác động từ API, alertdialog và không gửi DELETE khi chỉ mở', () => {
  const client = new QueryClient();
  client.setQueryData(
    ['profiles', 'a', 'f', 'pain', 'main', 'p', 'deletion-impact', issue.id],
    { entryCount: 5, exerciseCount: 2 },
    { updatedAt: Date.now() + 60_000 },
  );
  const api = { resolve: vi.fn(), reopen: vi.fn(), deleteIssue: vi.fn(), deletionImpact: vi.fn() };
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DeletePainIssueDialog
        api={api}
        session={session}
        profile={profile}
        scope="main"
        issue={issue}
        onClose={() => undefined}
        onSaved={() => undefined}
        onDeleted={() => undefined}
        onOpenIssue={() => undefined}
      />
    </QueryClientProvider>,
  );
  expect(html).toContain('role="alertdialog"');
  expect(html).toContain('5 lần ghi và 2 bài tập');
  expect(html).toContain('không khôi phục được');
  expect(api.deleteIssue).not.toHaveBeenCalled();
  client.clear();
});
