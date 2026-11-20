import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { householdMembersRepository } from '../../infrastructure/householdMembersRepository';
import { useMemberPanelActions } from './useMemberPanelActions';

vi.mock('../../infrastructure/householdMembersRepository', () => ({
  householdMembersRepository: { changeRole: vi.fn(), remove: vi.fn() },
}));

beforeEach(() => vi.resetAllMocks());

function probe() {
  const onReload = vi.fn(async () => undefined);
  const onClose = vi.fn();
  const onNotFound = vi.fn();
  let actions!: ReturnType<typeof useMemberPanelActions>;
  function Probe() {
    actions = useMemberPanelActions({
      member: { accountId: 'hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false },
      csrfToken: 'csrf',
      onReload,
      onClose,
      onNotFound,
    });
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { actions, onReload, onClose, onNotFound };
}

it('SPEC-066: gỡ thành công tải lại danh sách trước khi đóng chi tiết', async () => {
  vi.mocked(householdMembersRepository.remove).mockResolvedValue({ ok: true, value: undefined });
  const { actions, onReload, onClose } = probe();
  await actions.handleConfirmRemove();
  expect(householdMembersRepository.remove).toHaveBeenCalledWith('hoa', 'csrf');
  expect(onReload).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
  expect(onReload.mock.invocationCallOrder[0]).toBeLessThan(onClose.mock.invocationCallOrder[0]!);
});

it.each(['ERR_LAST_GUARDIAN', 'ERR_OWNER_PROTECTED'])(
  'SPEC-066: lỗi %s khi gỡ không đóng chi tiết như khi thành công',
  async (code) => {
    vi.mocked(householdMembersRepository.remove).mockResolvedValue({ ok: false, code });
    const { actions, onReload, onClose } = probe();
    await actions.handleConfirmRemove();
    expect(onReload).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  },
);

it('SPEC-066: không tìm thấy thành viên hiện notice và tải lại danh sách', async () => {
  vi.mocked(householdMembersRepository.remove).mockResolvedValue({ ok: false, code: 'ERR_NOT_FOUND' });
  const { actions, onReload, onClose, onNotFound } = probe();
  await actions.handleConfirmRemove();
  expect(onNotFound).toHaveBeenCalledWith('Người này không còn trong nhà.');
  expect(onReload).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();
});
