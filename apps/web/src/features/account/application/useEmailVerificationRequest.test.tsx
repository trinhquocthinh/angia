import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { SubmitEmailVerificationRequest } from './ports';
import { useEmailVerificationRequest } from './useEmailVerificationRequest';

const states = vi.hoisted(() => [] as unknown[]);
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: <T,>(initial: T) => [initial, (value: T) => states.push(value)],
}));
afterEach(() => {
  states.length = 0;
});

function mount(submit: SubmitEmailVerificationRequest, refresh = vi.fn(async () => {})) {
  let model!: ReturnType<typeof useEmailVerificationRequest>;
  function Probe() {
    model = useEmailVerificationRequest('csrf', submit, refresh);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { model, refresh };
}

it('TC-925: 202 hiện đúng thông báo gửi link 24 giờ và xoá thông báo khi bắt đầu lại', async () => {
  const { model } = mount(async () => ({ ok: true, data: { sent: true } }));
  await model.request();
  expect(states).toEqual([
    { busy: true, notice: null, error: null },
    { busy: false, notice: 'Đã gửi liên kết xác minh. Liên kết có hiệu lực 24 giờ.', error: null },
  ]);
  model.clear();
  expect(states.at(-1)).toEqual({ busy: false, notice: null, error: null });
});

it.each([
  ['TC-931', 'ERR_EMAIL_TAKEN', 'Email này đã được một tài khoản khác xác minh.'],
  ['TC-930', 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
])('%s: lỗi %s mở khoá thao tác và hiện câu catalog', async (_tc, code, error) => {
  const { model } = mount(async () => ({ ok: false, code }));
  await model.request();
  expect(states.at(-1)).toEqual({ busy: false, notice: null, error });
});

it('TC-925: 204 xoá trạng thái và tải lại phiên từ máy chủ', async () => {
  const { model, refresh } = mount(async () => ({ ok: true, data: { alreadyVerified: true } }));
  await model.request();
  expect(states.at(-1)).toEqual({ busy: false, notice: null, error: null });
  expect(refresh).toHaveBeenCalledTimes(1);
});
