import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { DeletionRequestPorts } from './householdHomePorts';
import { useDeletionRequestActions } from './useDeletionRequestActions';

function probe(ports: DeletionRequestPorts, csrfToken = 'csrf') {
  let result!: ReturnType<typeof useDeletionRequestActions>;
  function Probe() {
    result = useDeletionRequestActions(ports, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}

it('SPEC-069: gửi và thu hồi yêu cầu xoá nhà trả về ok hoặc lỗi kèm thời điểm', async () => {
  const allowedAt = new Date(2026, 10, 26, 10, 15).toISOString();
  const ports: DeletionRequestPorts = {
    requestDeletion: vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        value: { id: 'del-1', status: 'pending', executeAt: '2026-11-20T14:30:00.000Z' },
      })
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'ERR_RECENT_REMOVAL', details: { allowedAt } },
      }),
    revokeDeletion: vi.fn().mockResolvedValueOnce({ ok: true, value: undefined }),
  };

  const model = probe(ports);
  expect(await model.requestDeletion('Nhà Ngọc Lan')).toEqual({ status: 'ok' });
  expect(await model.requestDeletion('Nhà Ngọc Lan')).toEqual({
    status: 'error',
    code: 'ERR_RECENT_REMOVAL',
    message: 'Chưa thể xoá nhà. Bạn xoá được từ 26/11/2026 10:15.',
  });
  expect(await model.revokeDeletion('del-1')).toEqual({ status: 'ok' });
});
