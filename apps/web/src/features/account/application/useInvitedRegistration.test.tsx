import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useRegistrationForm } from './useRegistrationForm';
import type { SubmitRegistration } from './ports';
import {
  capturePendingInvitation,
  clearPendingInvitation,
  readPendingInvitation,
} from '@src/features/household/application/pendingHouseholdInvitation';
const token = 'a'.repeat(43);
const document = { version: '1', publishedAt: '2026-11-01T00:00:00Z', material: true, url: '/terms' };
const legal = {
  terms: { ...document, id: '11111111-1111-4111-8111-111111111111', kind: 'terms' as const },
  privacy: { ...document, id: '22222222-2222-4222-8222-222222222222', kind: 'privacy' as const },
};
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  clearPendingInvitation();
});
function mount(action: SubmitRegistration) {
  capturePendingInvitation(
    { pathname: '/invite', hash: `#token=${token}`, search: '' },
    { state: null, replaceState: vi.fn() },
  );
  const client = new QueryClient();
  clients.push(client);
  client.setQueryData(['account-legal'], { ok: true, data: legal }, { updatedAt: Date.now() + 60_000 });
  const success = vi.fn(async () => undefined);
  let model!: ReturnType<typeof useRegistrationForm>;
  function Probe() {
    model = useRegistrationForm(action, async () => ({ ok: true, data: legal }), success);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  model.form.setValue('legalAgreed', true);
  return { model, success };
}
it.each(['family', null])(
  'SPEC-065: đăng ký gửi token, chỉ xoá khi familyId=%s khác null',
  async (familyId) => {
    const action = vi.fn<SubmitRegistration>().mockResolvedValue({
      ok: true,
      data: {
        account: { id: 'account', username: 'lan', displayName: 'Lan', familyId },
        session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z' },
      },
    });
    const { model, success } = mount(action);
    await model.submit();
    expect(action.mock.calls[0]?.[0]).toHaveProperty('invitationToken', token);
    expect(readPendingInvitation()).toBe(familyId ? null : token);
    expect(success).toHaveBeenCalledOnce();
  },
);
it.each(['ERR_NOT_FOUND', 'ERR_REGISTRATION_CLOSED', 'ERR_DELETION_PENDING'])(
  'SPEC-065: đăng ký lỗi %s xoá token và không gọi thành công',
  async (code) => {
    const { model, success } = mount(async () => ({ ok: false, code }));
    await model.submit();
    expect(readPendingInvitation()).toBeNull();
    expect(success).not.toHaveBeenCalled();
  },
);
