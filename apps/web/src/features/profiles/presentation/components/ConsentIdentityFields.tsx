import type { ConsentDraft } from '../../application/readConsentDraft';
type Props = {
  id: string;
  draft: ConsentDraft;
  profileName: string;
  onChange: (value: ConsentDraft) => void;
};
export function ConsentIdentityFields({ id, draft, profileName, onChange }: Props) {
  return (
    <fieldset disabled={!draft.checked} className="mt-4 space-y-4 pl-8 disabled:opacity-60">
      <div>
        <label htmlFor={`${id}-basis`} className="text-sm font-semibold">
          Ai đã đồng ý?
        </label>
        <select
          id={`${id}-basis`}
          value={draft.basis}
          onChange={(event) => {
            const basis = event.target.value as ConsentDraft['basis'];
            onChange({ ...draft, basis, respondentName: basis === 'self' ? profileName : '' });
          }}
          className="mt-1.5 block h-11 w-full rounded-xl border border-[#bfc9c4]/40 bg-white px-3.5 text-sm"
        >
          <option value="">Chọn người đồng ý</option>
          <option value="self">Chính người này</option>
          <option value="guardian">Người giám hộ (cha, mẹ…)</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-semibold">
          Tên người đồng ý
        </label>
        <input
          id={`${id}-name`}
          value={draft.respondentName}
          onChange={(event) => onChange({ ...draft, respondentName: event.target.value })}
          maxLength={60}
          autoComplete="off"
          className="mt-1.5 block h-11 w-full rounded-xl border border-[#bfc9c4]/40 bg-white px-3.5 text-sm"
        />
      </div>
    </fieldset>
  );
}
