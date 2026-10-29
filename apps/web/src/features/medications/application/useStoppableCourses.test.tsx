import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { useStoppableCourses } from './useStoppableCourses';
const profile: HealthProfile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Mẹ',
  birthYear: null,
  vitalsEnabled: null,
  consentStatus: 'confirmed',
  consentConfirmedBy: null,
  consentConfirmedAt: null,
  consentBasis: null,
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-01T00:00:00Z',
};
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
describe('Cache danh sách chọn đợt dừng', () => {
  it('TC-051: cache cách ly theo tài khoản, gia đình và hồ sơ', () => {
    const client = new QueryClient();
    client.setQueryData(['medications', 'a', 'f', 'p', 'stoppable'], { today: '2026-10-11', courses: [] });
    function Probe({ context }: { context: ProfileSession }) {
      const query = useStoppableCourses(
        {
          list: async () => {
            throw new Error('Không gọi khi render');
          },
          stop: async () => {
            throw new Error('Không ghi');
          },
        },
        context,
        profile,
      );
      return <p>{query.data?.today ?? 'Không có dữ liệu'}</p>;
    }
    const view = (context: ProfileSession) =>
      renderToStaticMarkup(
        <QueryClientProvider client={client}>
          <Probe context={context} />
        </QueryClientProvider>,
      );
    expect(view(session)).toContain('2026-10-11');
    expect(view({ ...session, family: { id: 'other', name: 'Khác' } })).toContain('Không có dữ liệu');
    expect(view({ ...session, account: { ...session.account, id: 'other' } })).toContain('Không có dữ liệu');
    client.clear();
  });
});
