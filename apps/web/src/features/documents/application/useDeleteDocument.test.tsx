import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { ReviewRepository } from './reviewPorts';
import { useDeleteDocument } from './useDeleteDocument';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const impact = {
  prescriptions: 2,
  prescriptionItems: 5,
  labResults: 1,
  measurements: 3,
  medicationCourses: 4,
  activeMedicationCourses: 2,
};
const key = ['document-deletion-impact', 'a', 'f', 'd'];
const repo = () => ({
  deletionImpact: vi.fn(async () => impact),
  deleteDocument: vi.fn(async () => undefined),
});
function mount(
  client: QueryClient,
  repository: Pick<ReviewRepository, 'deletionImpact' | 'deleteDocument'>,
  context = session,
  open = true,
) {
  let hook: ReturnType<typeof useDeleteDocument> | undefined;
  function Probe() {
    hook = useDeleteDocument(repository, context, 'd', 'p', open);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return hook!;
}
describe('TC-437 xóa chứng từ và cache', () => {
  it('xóa với CSRF và làm mới đủ cache đúng phạm vi, gỡ chi tiết chứng từ', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    client.setQueryData(key, impact);
    const keys = [
      ['review', 'a', 'f', 'queue'],
      ...['documents', 'medications', 'measurements', 'lab-results', 'visit-summary'].map((name) => [
        name,
        'a',
        'f',
        'p',
      ]),
      ['family-usage'],
    ];
    const other = ['documents', 'a', 'f', 'khác'];
    for (const item of [...keys, other]) client.setQueryData(item, {});
    const detail = ['review', 'a', 'f', 'document', 'd'];
    client.setQueryData(detail, {});
    const repository = repo();
    expect(await mount(client, repository).remove()).toBe(true);
    expect(repository.deleteDocument).toHaveBeenCalledWith('d', 'csrf');
    expect(keys.map((item) => client.getQueryState(item)?.isInvalidated)).toEqual(keys.map(() => true));
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    expect(client.getQueryData(detail)).toBeUndefined();
    expect(client.getQueryData(key)).toBeUndefined();
    client.clear();
  });
  it('không xóa khi thiếu tác động, đóng dialog, member hoặc thiếu CSRF', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    const repository = repo();
    expect(await mount(client, repository).remove()).toBe(false);
    client.setQueryData(key, impact);
    expect(await mount(client, repository, session, false).remove()).toBe(false);
    expect(await mount(client, repository, { ...session, role: 'member' }).remove()).toBe(false);
    expect(await mount(client, repository, { ...session, csrfToken: '' }).remove()).toBe(false);
    expect(repository.deleteDocument).not.toHaveBeenCalled();
    client.clear();
  });
  it('chặn gửi lặp và không báo thành công khi DELETE thất bại', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    client.setQueryData(key, impact);
    let finish: () => void = () => undefined;
    const repository = {
      ...repo(),
      deleteDocument: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      ),
    };
    const hook = mount(client, repository);
    const first = hook.remove();
    expect(await hook.remove()).toBe(false);
    finish();
    expect(await first).toBe(true);
    expect(repository.deleteDocument).toHaveBeenCalledTimes(1);
    client.setQueryData(key, impact);
    const failed = {
      ...repo(),
      deleteDocument: async () => {
        throw new TypeError('network');
      },
    };
    expect(await mount(client, failed).remove()).toBe(false);
    expect(client.getQueryData(key)).toEqual(impact);
    client.clear();
  });
});
