import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { HouseholdMember, HouseholdMembersRepository } from './memberPorts';
import { useHouseholdMembers } from './useHouseholdMembers';

const useQueryMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

const sample: HouseholdMember[] = [
  { accountId: '1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
  { accountId: '2', displayName: 'Lan', role: 'main', isOwner: false, isSelf: true },
];

it('SPEC-066: tải danh sách thành viên theo scope và ném thông báo khi lỗi', async () => {
  let capturedOptions: { queryKey: unknown; queryFn: () => Promise<HouseholdMember[]> } | undefined;
  useQueryMock.mockImplementation((options) => {
    capturedOptions = options;
    return { data: sample, isPending: false, isError: false, error: null };
  });

  const repository: HouseholdMembersRepository = {
    list: vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: sample })
      .mockResolvedValueOnce({ ok: false, code: 'NETWORK' }),
    changeRole: vi.fn(),
    remove: vi.fn(),
  };

  let hook!: ReturnType<typeof useHouseholdMembers>;
  function Probe() {
    hook = useHouseholdMembers(repository, 'acc:fam');
    return null;
  }
  renderToStaticMarkup(<Probe />);

  expect(capturedOptions?.queryKey).toEqual(['household-members', 'acc:fam']);
  expect(await capturedOptions?.queryFn()).toEqual(sample);
  await expect(capturedOptions?.queryFn()).rejects.toThrow('Mất kết nối');

  await hook.reload();
  expect(invalidateQueriesMock).toHaveBeenCalledWith({
    queryKey: ['household-members', 'acc:fam'],
  });
});
