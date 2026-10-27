import { useId } from 'react';
import type { ConsentDraft, ConsentMode } from '../../application/readConsentDraft';
import { ConsentIdentityFields } from './ConsentIdentityFields';
type Props = {
  mode: ConsentMode;
  draft: ConsentDraft;
  profileName: string;
  onChange: (value: ConsentDraft) => void;
};
export function ConsentFields({ mode, draft, profileName, onChange }: Props) {
  const id = useId();
  if (mode === 'invitation') return null;
  return (
    <section className="rounded-xl bg-[#eaf6f5] p-4" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="font-semibold text-[#004135]">
        Đồng ý lưu dữ liệu sức khỏe
      </h2>
      <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          checked={draft.checked}
          onChange={(event) => onChange({ ...draft, checked: event.target.checked })}
          aria-describedby={`${id}-notice`}
          className="mt-1 h-5 w-5 shrink-0 accent-[#004135]"
        />
        {mode === 'self' ? 'Tôi đồng ý' : 'Tôi đã hỏi và được đồng ý'}
      </label>
      <p id={`${id}-notice`} className="mt-2 text-sm leading-6 text-[#55615f]">
        {mode === 'self'
          ? 'Tôi đồng ý cho AN GIA lưu thông tin sức khỏe của tôi.'
          : 'Tôi đã hỏi ý kiến và được chính người này (hoặc người giám hộ hợp pháp) đồng ý cho AN GIA lưu thông tin sức khỏe của họ. Tôi chịu trách nhiệm về xác nhận này.'}
      </p>
      {mode === 'attestation' && (
        <ConsentIdentityFields id={id} draft={draft} profileName={profileName} onChange={onChange} />
      )}
    </section>
  );
}
