import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProfileRequest } from '../application/ports';
import type { ConsentDraft } from '../application/readConsentDraft';
import { useProfileForm } from './useProfileForm';
const consent: ConsentDraft = { checked: true, basis: 'guardian', respondentName: '  Mẹ  ' };
function mount(
  draft: ConsentDraft,
  linkedAccountId: string,
  onSave: (body: ProfileRequest) => Promise<unknown>,
) {
  const data = new FormData();
  data.set('displayName', ' Bé An ');
  data.set('linkedAccountId', linkedAccountId);
  vi.stubGlobal(
    'FormData',
    class {
      constructor() {
        return data;
      }
    },
  );
  let hook: ReturnType<typeof useProfileForm>;
  function Probe() {
    hook = useProfileForm(false, onSave, 'main', draft);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return hook!;
}
afterEach(() => vi.unstubAllGlobals());
describe('TC-558 — nối form tạo hồ sơ tới payload consent', () => {
  it.each([
    [
      '',
      consent,
      {
        displayName: 'Bé An',
        consent: { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'Mẹ' },
      },
    ],
    ['', { ...consent, checked: false }, { displayName: 'Bé An' }],
    ['main', consent, { displayName: 'Bé An', linkedAccountId: 'main', consent: { kind: 'self' } }],
    ['main', { ...consent, checked: false }, { displayName: 'Bé An', linkedAccountId: 'main' }],
    ['other', consent, { displayName: 'Bé An', linkedAccountId: 'other' }],
  ] as const)('liên kết %s và trạng thái tick gửi đúng DTO', async (linked, draft, expected) => {
    const save = vi.fn(async () => undefined);
    await mount(draft, linked, save).save({} as HTMLFormElement);
    expect(save).toHaveBeenCalledExactlyOnceWith(expected);
  });
  it('không gửi khi tick nhưng chưa có tên/tư cách; không gửi hai lần', async () => {
    const save = vi.fn(async () => undefined);
    await mount({ ...consent, respondentName: '' }, '', save).save({} as HTMLFormElement);
    expect(save).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    let finish!: () => void;
    const pending = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const hook = mount(consent, '', pending);
    const first = hook.save({} as HTMLFormElement);
    await hook.save({} as HTMLFormElement);
    expect(pending).toHaveBeenCalledTimes(1);
    finish();
    await first;
  });
});
