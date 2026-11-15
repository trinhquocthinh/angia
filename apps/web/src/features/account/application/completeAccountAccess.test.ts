import { expect, it, vi } from 'vitest';
import { completeAccountAccess } from './completeAccountAccess';
it('chờ invalidate phiên hoàn tất trước khi điều hướng replace về trang chủ', async () => {
  let release!: () => void;
  const invalidate = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const navigate = vi.fn(async () => undefined);
  const completed = completeAccountAccess(invalidate, navigate);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['current-session'] });
  expect(navigate).not.toHaveBeenCalled();
  release();
  await completed;
  expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true });
});
