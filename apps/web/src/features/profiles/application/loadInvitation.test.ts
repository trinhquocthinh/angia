import { describe, expect, it, vi } from 'vitest';
import type { InvitationRepository, InvitationView } from './invitationPorts';
import { InvitationRequestError } from './InvitationRequestError';
import { loadInvitation } from './loadInvitation';
const view: InvitationView = {
  profileDisplayName: 'Mẹ',
  inviterDisplayName: 'An',
  expiresAt: '2026-10-13T00:00:00Z',
  status: 'pending',
};
describe('TC-106 — Tải lời mời không ghi đè state của token mới', () => {
  it('request cũ hoàn tất sau token mới không thay nội dung hiện tại', async () => {
    let finish: (value: InvitationView) => void = () => undefined;
    const old = new Promise<InvitationView>((resolve) => {
      finish = resolve;
    });
    const repository: InvitationRepository = {
      view: vi.fn((token) =>
        token === 'old' ? old : Promise.resolve({ ...view, profileDisplayName: 'Ba' }),
      ),
      respond: vi.fn(),
    };
    const update = vi.fn();
    const controller = new AbortController();
    const pending = loadInvitation(repository, 'old', controller.signal, update);
    controller.abort();
    await loadInvitation(repository, 'new', new AbortController().signal, update);
    finish(view);
    await pending;
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ state: 'ready', view: { ...view, profileDisplayName: 'Ba' } });
    expect(repository.respond).not.toHaveBeenCalled();
  });
  it.each([404, 500])('HTTP %s hiển thị unavailable hoặc retry, không lỗi server', async (status) => {
    const update = vi.fn();
    const repository: InvitationRepository = {
      view: async () => {
        throw new InvitationRequestError(status);
      },
      respond: vi.fn(),
    };
    await loadInvitation(repository, 'opaque', new AbortController().signal, update);
    expect(update).toHaveBeenCalledWith({ state: status === 404 ? 'unavailable' : 'error' });
  });
  it('lỗi request đã hủy không hiển thị lên lời mời mới', async () => {
    const controller = new AbortController();
    controller.abort();
    const update = vi.fn();
    await loadInvitation(
      {
        view: async () => {
          throw new Error('secret');
        },
        respond: vi.fn(),
      },
      'old',
      controller.signal,
      update,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
