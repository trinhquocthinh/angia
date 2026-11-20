import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useHouseholdHomeController } from './useHouseholdHomeController';

const reloads = vi.hoisted(() => ({ members: vi.fn(), offer: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../application/useHouseholdMembers', () => ({
  useHouseholdMembers: () => ({ query: { data: [], isPending: false }, reload: reloads.members }),
}));
vi.mock('../../application/useOwnershipOffer', () => ({
  useOwnershipOffer: () => ({ query: { data: null }, reload: reloads.offer }),
}));

it('SPEC-068: đổi vai trò hoặc gỡ người tải lại cả danh sách và đề nghị trao quyền có thể đã bị thu hồi', async () => {
  let controller!: ReturnType<typeof useHouseholdHomeController>;
  function Probe() {
    controller = useHouseholdHomeController({
      familyName: 'Nhà Ngọc Lan',
      viewerRole: 'main',
      scope: 'account:family',
      hasFamily: true,
      csrfToken: 'csrf',
    });
    return null;
  }
  const client = new QueryClient();
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  await controller.onReloadMembers();
  expect(reloads.members).toHaveBeenCalledOnce();
  expect(reloads.offer).toHaveBeenCalledOnce();
  client.clear();
});
