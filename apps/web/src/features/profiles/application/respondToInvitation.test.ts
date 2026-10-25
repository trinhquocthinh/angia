import { describe, expect, it, vi } from 'vitest';
import type { InvitationDraft, InvitationReceipt, InvitationRepository } from './invitationPorts';
import { respondToInvitation } from './respondToInvitation';
import { InvitationRequestError } from './InvitationRequestError';
const body: InvitationDraft = { respondentName: 'An', basis: 'self', decision: 'accepted' };
const receipt: InvitationReceipt = { ...body, outcome: 'recorded', respondedAt: '2026-10-06T00:00:00Z' };
describe('TC-106 — Phản hồi đang gửi không ghi đè lời mời mới', () => {
  it('response cũ về sau khi rời token cũ bị bỏ, giữ nguyên first decision mới', async () => {
    let finish: (result: InvitationReceipt) => void = () => undefined;
    const old = new Promise<InvitationReceipt>((resolve) => {
      finish = resolve;
    });
    const repo: InvitationRepository = {
      view: vi.fn(),
      respond: vi.fn((token) =>
        token === 'v1.old' ? old : Promise.resolve({ ...receipt, decision: 'declined' as const }),
      ),
    };
    const controller = new AbortController();
    const request = respondToInvitation(repo, 'v1.old', body, controller.signal);
    controller.abort();
    expect(
      await respondToInvitation(
        repo,
        'v1.new',
        { ...body, decision: 'declined' as const },
        new AbortController().signal,
      ),
    ).toEqual({ state: 'receipt', receipt: { ...receipt, decision: 'declined' as const } });
    finish(receipt);
    expect(await request).toBeNull();
  });
  it.each([404, 500])('HTTP %s không tạo receipt giả hoặc lộ thông báo server', async (status) => {
    expect(
      await respondToInvitation(
        {
          view: vi.fn(),
          respond: async () => {
            throw new InvitationRequestError(status);
          },
        },
        'v1.payload',
        body,
        new AbortController().signal,
      ),
    ).toEqual({ state: status === 404 ? 'unavailable' : 'error' });
  });
  it('giữ outcome already_responded để UI không giả lập ghi thêm', async () => {
    const result = { ...receipt, outcome: 'already_responded' as const };
    expect(
      await respondToInvitation(
        { view: vi.fn(), respond: async () => result },
        'v1.payload',
        body,
        new AbortController().signal,
      ),
    ).toEqual({ state: 'receipt', receipt: result });
  });
});
