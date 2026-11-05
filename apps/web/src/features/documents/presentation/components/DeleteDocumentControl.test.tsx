import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { entry } from '../../application/documentEntryFixtures.test-helper';
import { createReviewRepository } from '../../infrastructure/createReviewRepository';
import { DocumentEntryPanel } from '../entries/DocumentEntryPanel';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
function panel(origin: 'document' | 'manual', role: ProfileSession['role']) {
  const client = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DocumentEntryPanel
        entry={entry({ origin })}
        canReuse={false}
        onReuse={() => undefined}
        onClose={() => undefined}
        deletion={{
          repository: createReviewRepository(),
          session: { ...session, role },
          profileId: 'p',
          onDeleted: () => undefined,
        }}
      />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}
describe('TC-436 điểm xóa trong ngăn giấy tờ', () => {
  it('main thấy nút xóa chứng từ', () => {
    expect(panel('document', 'main')).toContain('Xóa chứng từ');
  });
  it('member không thấy nút xóa', () => {
    expect(panel('document', 'member')).not.toContain('Xóa chứng từ');
  });
  it('bản nhập tay không có nút xóa chứng từ', () => {
    expect(panel('manual', 'main')).not.toContain('Xóa chứng từ');
  });
});
