import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileListItem } from '../../application/ports';
import type { ConsentDraft } from '../../application/readConsentDraft';
import { ConsentFields } from './ConsentFields';
import { ConsentAttestationForm } from './ConsentAttestationForm';
const profile: ProfileListItem = {
  id: 'p',
  familyId: 'f',
  displayName: 'Bé',
  birthYear: null,
  vitalsEnabled: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus: 'declined',
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-27T00:00:00Z',
  consentAction: 'attestation',
  consentConfirmedByName: null,
};
const valid: ConsentDraft = { checked: true, basis: 'guardian', respondentName: 'Mẹ' };
function form(draft = valid, item = profile, pending = false) {
  return renderToStaticMarkup(
    <ConsentAttestationForm
      profile={item}
      draft={draft}
      pending={pending}
      error={null}
      onChange={() => undefined}
      onSubmit={() => undefined}
      onCancel={() => undefined}
    />,
  );
}
describe('TC-558 — khối đồng thuận và hộp thoại', () => {
  it.each(['attestation', 'self', 'invitation'] as const)('hiện đúng khối ở chế độ %s', (mode) => {
    const html = renderToStaticMarkup(
      <ConsentFields
        mode={mode}
        draft={{ ...valid, checked: false }}
        profileName="Bé"
        onChange={() => undefined}
      />,
    );
    if (mode === 'invitation') expect(html).toBe('');
    else {
      expect(html).toContain(mode === 'self' ? 'Tôi đồng ý' : 'Tôi đã hỏi và được đồng ý');
      expect(html.includes('Ai đã đồng ý?')).toBe(mode === 'attestation');
      expect(html).not.toContain('checked=""');
    }
  });
  it('declined có cảnh báo; mở lại phải tick lại, không mặc định đồng ý', () => {
    const html = form({ ...valid, checked: false });
    expect(html).toContain('Trước đây có phản hồi không đồng ý qua link');
    expect(html).toMatch(/type="submit" disabled=""/);
    expect(html).not.toContain('checked=""');
  });
  it.each([
    { ...valid, checked: false },
    { ...valid, basis: '' as const },
    { ...valid, respondentName: ' ' },
    { ...valid, respondentName: 'a'.repeat(61) },
  ])('khóa gửi khi thiếu/sai bằng chứng cam kết', (draft) =>
    expect(form(draft)).toMatch(/type="submit" disabled=""/),
  );
  it('đủ cam kết thì gửi được; đang gửi khóa cả hủy và các trường', () => {
    expect(form()).not.toMatch(/type="submit" disabled=""/);
    const pending = form(valid, profile, true);
    expect(pending).toContain('<fieldset disabled=""');
    expect(pending).toMatch(/type="button" disabled=""/);
  });
  it('self chỉ cần tick, không bắt nhập tư cách hoặc tên', () => {
    const html = form(
      { checked: true, basis: '', respondentName: '' },
      { ...profile, consentStatus: 'pending', consentAction: 'self' },
    );
    expect(html).not.toContain('Ai đã đồng ý?');
    expect(html).not.toMatch(/type="submit" disabled=""/);
    expect(html).not.toContain('Trước đây có phản hồi');
  });
});
