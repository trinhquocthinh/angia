import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useRegistrationForm } from './useRegistrationForm';
import type { FetchCurrentLegal, SubmitRegistration } from './ports';
const legal = {
  terms: {
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'terms' as const,
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/terms',
  },
  privacy: {
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'privacy' as const,
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/privacy',
  },
};
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.unstubAllGlobals();
});
function registrationModel(
  submitRegistration: SubmitRegistration,
  fetchLegal: FetchCurrentLegal = async () => ({ ok: true, data: legal }),
) {
  const client = new QueryClient();
  clients.push(client);
  client.setQueryData(['account-legal'], { ok: true, data: legal }, { updatedAt: Date.now() + 60_000 });
  const success = vi.fn(async () => undefined);
  let model!: ReturnType<typeof useRegistrationForm>;
  function Probe() {
    model = useRegistrationForm(submitRegistration, fetchLegal, success);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  model.form.subscribe({ formState: {}, callback: () => undefined });
  model.form.setValue('username', 'me.lan');
  model.form.setValue('password', 'matkhau123');
  model.form.setValue('displayName', 'Lan');
  model.form.setValue('legalAgreed', true);
  return { model, success, client };
}
it('TC-736/739: đăng ký không email rỗng, gửi nguyên tuổi và ID hiện hành', async () => {
  const submit = vi.fn<SubmitRegistration>().mockResolvedValue({
    ok: true,
    data: {
      account: { id: 'account', username: 'me.lan', displayName: 'Lan', familyId: null },
      session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z' },
    },
  });
  const { model, success } = registrationModel(submit);
  await model.submit();
  expect(submit).toHaveBeenCalledWith({
    username: 'me.lan',
    password: 'matkhau123',
    displayName: 'Lan',
    ageConfirmed: false,
    legalAcceptance: {
      termsVersionId: '11111111-1111-4111-8111-111111111111',
      privacyVersionId: '22222222-2222-4222-8222-222222222222',
    },
  });
  expect(success).toHaveBeenCalledOnce();
});
it.each(['username', 'password', 'displayName', 'email', 'ageConfirmed'])(
  'lỗi %s nhận message tại ô và chuyển focus sau phản hồi',
  async (field) => {
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => callback());
    const { model, success } = registrationModel(async () => ({ ok: false, code: 'ERR_VALIDATION', field }));
    const focus = vi.spyOn(model.form, 'setFocus');
    await model.submit();
    expect(model.form.getFieldState(field as 'username').error?.message).toBe(
      'Dữ liệu gửi lên không đúng định dạng quy định.',
    );
    expect(focus).toHaveBeenCalledWith(field);
    expect(success).not.toHaveBeenCalled();
  },
);
it('TC-737: tên trùng dùng lỗi đúng catalog và focus username', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => callback());
  const { model } = registrationModel(async () => ({ ok: false, code: 'ERR_USERNAME_TAKEN' }));
  const focus = vi.spyOn(model.form, 'setFocus');
  await model.submit();
  expect(model.form.getFieldState('username').error?.message).toBe('Tên đăng nhập này đã có người dùng.');
  expect(focus).toHaveBeenCalledWith('username');
});
it('TC-742: details.current hợp lệ thay cache, bỏ tick và không gọi GET', async () => {
  const current = { ...legal, terms: { ...legal.terms, id: '33333333-3333-4333-8333-333333333333' } };
  const fetchLegal = vi.fn<FetchCurrentLegal>();
  const { model, client } = registrationModel(
    async () => ({ ok: false, code: 'ERR_LEGAL_VERSION_OUTDATED', current }),
    fetchLegal,
  );
  expect(model.form.getValues('legalAgreed')).toBe(true);
  await model.submit();
  expect(model.form.getValues('legalAgreed')).toBe(false);
  expect(client.getQueryData(['account-legal'])).toEqual({ ok: true, data: current });
  expect(fetchLegal).not.toHaveBeenCalled();
});
it('TC-742: details.current sai dạng thì gọi lại GET', async () => {
  const current = { ...legal, privacy: { ...legal.privacy, id: '44444444-4444-4444-8444-444444444444' } };
  const fetchLegal = vi.fn<FetchCurrentLegal>().mockResolvedValue({ ok: true, data: current });
  const { model, client } = registrationModel(
    async () => ({ ok: false, code: 'ERR_LEGAL_VERSION_OUTDATED', current: {} }),
    fetchLegal,
  );
  expect(model.form.getValues('legalAgreed')).toBe(true);
  await model.submit();
  expect(model.form.getValues('legalAgreed')).toBe(false);
  expect(fetchLegal).toHaveBeenCalledOnce();
  expect(client.getQueryData(['account-legal'])).toEqual({ ok: true, data: current });
});
it('chưa đồng ý thì không gửi dù gọi thẳng handler', async () => {
  const submit = vi.fn<SubmitRegistration>();
  const { model } = registrationModel(submit);
  model.form.setValue('legalAgreed', false);
  await model.submit();
  expect(submit).not.toHaveBeenCalled();
});
it('TC-742: tải lại thất bại xoá bản cũ khỏi cache', async () => {
  const { model, client } = registrationModel(
    async () => ({ ok: false, code: 'ERR_LEGAL_VERSION_OUTDATED' }),
    async () => ({ ok: false, code: 'NETWORK' }),
  );
  await model.submit();
  expect(client.getQueryData(['account-legal'])).toEqual({ ok: false, code: 'NETWORK' });
});
it('TC-846: trong lúc đăng ký đang chờ giữ trạng thái gửi và mở lại khi 429', async () => {
  let release!: (value: Awaited<ReturnType<SubmitRegistration>>) => void;
  const { model, success } = registrationModel(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const busy: boolean[] = [];
  const observed = { submitCount: true, isSubmitting: true };
  const unsubscribe = model.form.subscribe({
    formState: observed,
    callback: (state) => {
      busy.push(Boolean(state.isSubmitting));
    },
  });
  const pending = model.submit();
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  expect(busy.at(-1)).toBe(true);
  release({ ok: false, code: 'ERR_RATE_LIMITED' });
  await pending;
  expect(busy.at(-1)).toBe(false);
  expect(success).not.toHaveBeenCalled();
  unsubscribe();
});
