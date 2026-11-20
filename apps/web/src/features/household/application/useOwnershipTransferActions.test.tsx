import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { OwnershipTransferPorts } from './householdHomePorts';
import { useOwnershipTransferActions } from './useOwnershipTransferActions';

function probe(ports: OwnershipTransferPorts, csrfToken = 'csrf') {
  let result!: ReturnType<typeof useOwnershipTransferActions>;
  function Probe() {
    result = useOwnershipTransferActions(ports, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}

it('SPEC-068: gửi, thu hồi và phản hồi đề nghị trao quyền trả về ok hoặc thông báo lỗi chuẩn', async () => {
  const ports: OwnershipTransferPorts = {
    sendOffer: vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        value: {
          id: 'o-1',
          targetAccountId: 't-1',
          status: 'pending',
          createdAt: '2026-11-19T08:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ ok: false, error: { code: 'ERR_OWNERSHIP_TRANSFER_PENDING' } }),
    revokeOffer: vi.fn().mockResolvedValueOnce({ ok: true, value: undefined }),
    decideOffer: vi.fn().mockResolvedValueOnce({ ok: true, value: undefined }),
  };

  const model = probe(ports);
  expect(await model.sendOffer('t-1')).toEqual({ status: 'ok' });
  expect(await model.sendOffer('t-1')).toEqual({
    status: 'error',
    code: 'ERR_OWNERSHIP_TRANSFER_PENDING',
    message: 'Đang có đề nghị trao quyền Chủ hộ chờ trả lời.',
  });
  expect(await model.revokeOffer('o-1')).toEqual({ status: 'ok' });
  expect(await model.decideOffer('o-1', true)).toEqual({ status: 'ok' });
});
