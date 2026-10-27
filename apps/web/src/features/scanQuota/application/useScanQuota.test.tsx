import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { policyInput, quota, view } from '../test/scanQuotaFixtures';
import type { ScanQuotaRepository } from './ports';
import { useAdminScanQuota } from './useAdminScanQuota';
import { useFamilyScanQuota } from './useFamilyScanQuota';
function harness(account: string | null = 'a', family: string | null = 'f') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['admin', 'scan-quotas', 'a'], view);
  client.setQueryData(['current-session'], {});
  const repository: ScanQuotaRepository = {
    getAdmin: vi.fn(async () => view),
    getFamily: vi.fn(async () => quota),
    savePolicy: vi.fn(async () => ({ ...view, version: 8 })),
    grant: vi.fn(async () => ({ ...view, version: 8 })),
  };
  let admin!: ReturnType<typeof useAdminScanQuota>;
  let member!: ReturnType<typeof useFamilyScanQuota>;
  function Probe() {
    admin = useAdminScanQuota(repository, account ? 'csrf' : null, account);
    member = useFamilyScanQuota(repository, account, family);
    return null;
  }
  const render = () =>
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  render();
  return {
    client,
    repository,
    get admin() {
      return admin;
    },
    get member() {
      return member;
    },
    render,
    setAccount: (next: string) => {
      account = next;
    },
  };
}
describe('Cache hạn mức theo phiên', () => {
  it('TC-590: không có phiên không tải hoặc ghi', async () => {
    const h = harness(null, null);
    expect(h.repository.getAdmin).not.toHaveBeenCalled();
    expect(h.repository.getFamily).not.toHaveBeenCalled();
    await expect(h.admin.savePolicy(policyInput)).rejects.toMatchObject({ status: 401 });
    expect(h.repository.savePolicy).not.toHaveBeenCalled();
    h.client.clear();
  });
  it('TC-590: khóa gia đình gồm tài khoản và gia đình, không chứa CSRF', async () => {
    const h = harness();
    await h.member.refetch();
    expect(h.client.getQueryData(['family', 'scan-quota', 'a', 'f'])).toEqual(quota);
    expect(h.client.getQueryData(['family', 'scan-quota', 'b', 'f'])).toBeUndefined();
    expect(h.client.getQueryData(['family', 'scan-quota', 'a', 'g'])).toBeUndefined();
    h.client.clear();
  });
  it('TC-590: GET cũ không đè mutation và mutation chỉ ghi tài khoản đã bắt đầu', async () => {
    const h = harness();
    let resolveGet!: (value: typeof view) => void;
    let resolveSave!: (value: typeof view) => void;
    const background = h.client
      .fetchQuery({
        queryKey: ['admin', 'scan-quotas', 'a'],
        staleTime: 0,
        queryFn: () =>
          new Promise<typeof view>((resolve) => {
            resolveGet = resolve;
          }),
      })
      .catch(() => undefined);
    vi.mocked(h.repository.savePolicy).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const saving = h.admin.savePolicy(policyInput);
    await vi.waitFor(() => expect(h.repository.savePolicy).toHaveBeenCalledTimes(1));
    h.client.setQueryData(['admin', 'scan-quotas', 'b'], { ...view, version: 99 });
    h.setAccount('b');
    h.render();
    resolveSave({ ...view, version: 8 });
    await saving;
    resolveGet(view);
    await background;
    expect(h.client.getQueryData(['admin', 'scan-quotas', 'a'])).toMatchObject({ version: 8 });
    expect(h.client.getQueryData(['admin', 'scan-quotas', 'b'])).toMatchObject({ version: 99 });
    h.client.clear();
  });
  it.each([401, 403])('TC-590: GET và mutation %s làm mới phiên, không retry', async (status) => {
    const h = harness();
    vi.mocked(h.repository.getFamily).mockRejectedValue(new AdminRequestError('ERR_FORBIDDEN', status));
    await h.member.refetch();
    expect(h.client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    vi.mocked(h.repository.savePolicy).mockRejectedValue(new AdminRequestError('ERR_FORBIDDEN', status));
    await expect(h.admin.savePolicy(policyInput)).rejects.toMatchObject({ status });
    expect(h.repository.savePolicy).toHaveBeenCalledTimes(1);
    h.client.clear();
  });
  it('TC-591: xung đột giữ cache và version bản sửa, không tự tải hoặc thử lại', async () => {
    const h = harness();
    vi.mocked(h.repository.savePolicy).mockRejectedValue(
      new AdminRequestError('ERR_SCAN_QUOTA_CONFLICT', 409),
    );
    await expect(h.admin.savePolicy(policyInput)).rejects.toMatchObject({ status: 409 });
    expect(h.repository.getAdmin).not.toHaveBeenCalled();
    expect(h.client.getQueryData(['admin', 'scan-quotas', 'a'])).toEqual(view);
    expect(policyInput.expectedVersion).toBe(7);
    h.client.clear();
  });
});
