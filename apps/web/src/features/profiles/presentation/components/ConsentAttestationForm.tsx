import type { ConsentConfirmation, ProfileListItem } from '../../application/ports';
import { readConsentDraft } from '../../application/readConsentDraft';
import type { ConsentDraft } from '../../application/readConsentDraft';
import { ConsentFields } from './ConsentFields';
type Props = {
  profile: ProfileListItem;
  draft: ConsentDraft;
  pending: boolean;
  error: string | null;
  onChange: (draft: ConsentDraft) => void;
  onSubmit: (body: ConsentConfirmation) => void;
  onCancel: () => void;
};
export function ConsentAttestationForm({
  profile,
  draft,
  pending,
  error,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const mode = profile.consentAction === 'self' ? 'self' : 'attestation';
  const result = readConsentDraft(draft, mode);
  return (
    <form
      noValidate
      className="space-y-5 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending && result.body) onSubmit(result.body);
      }}
    >
      <h2 id="consent-attestation-title" className="text-xl font-semibold text-[#004135]">
        Xác nhận đồng ý
      </h2>
      <p id="consent-attestation-description" className="break-words text-sm">
        Hồ sơ: {profile.displayName}
      </p>
      {profile.consentStatus === 'declined' && (
        <p role="alert" className="rounded-xl bg-[#fff4e5] p-4 text-sm leading-6">
          Trước đây có phản hồi không đồng ý qua link. Chỉ xác nhận sau khi đã hỏi lại và được đồng ý.
        </p>
      )}
      <fieldset disabled={pending}>
        <ConsentFields mode={mode} draft={draft} profileName={profile.displayName} onChange={onChange} />
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || !result.body}
          className="min-h-12 rounded-xl bg-[#004135] px-5 py-3 font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang xác nhận…' : 'Xác nhận đồng ý'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="min-h-12 rounded-xl border border-[#004135] px-5 py-3 font-semibold text-[#004135] disabled:opacity-55"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
