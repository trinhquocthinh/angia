import { describe, expect, it, vi } from 'vitest';
import type { InvitationReceipt, InvitationRepository } from './invitationPorts';
import { respondToInvitation } from './respondToInvitation';
import { InvitationRequestError } from './InvitationRequestError';
const receipt: InvitationReceipt = {
  outcome: 'linked',
  profileId: 'p',
  profileName: 'Mẹ',
  consentStatus: 'confirmed',
};
describe('SPEC-040 — Xác nhận link liên kết', () => {
  it('gửi đúng quyết định, token và CSRF', async () => {
    const respond = vi.fn(async () => receipt);
    const result = await respondToInvitation(
      { view: vi.fn(), respond },
      'v1.a',
      'declined',
      'csrf',
      new AbortController().signal,
    );
    expect(respond).toHaveBeenCalledWith('v1.a', 'declined', 'csrf', expect.anything());
    expect(result).toEqual({ state: 'receipt', receipt });
  });
  it('phản hồi về sau khi đã rời token cũ bị bỏ', async () => {
    let finish: (value: InvitationReceipt) => void = () => undefined;
    const repo: InvitationRepository = {
      view: vi.fn(),
      respond: () => new Promise((resolve) => (finish = resolve)),
    };
    const controller = new AbortController();
    const request = respondToInvitation(repo, 'v1.old', 'accepted', 'csrf', controller.signal);
    controller.abort();
    finish(receipt);
    expect(await request).toBeNull();
  });
  it.each([
    [404, 'unavailable'],
    [409, 'conflict'],
    [500, 'error'],
  ])('HTTP %s → %s, không tạo biên nhận giả', async (status, state) => {
    expect(
      await respondToInvitation(
        {
          view: vi.fn(),
          respond: async () => {
            throw new InvitationRequestError(status);
          },
        },
        'v1.a',
        'accepted',
        'csrf',
        new AbortController().signal,
      ),
    ).toEqual({ state });
  });
});
