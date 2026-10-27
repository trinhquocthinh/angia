import { useProfileConsentForm } from '../useProfileConsentForm';
import { ConsentFields } from './ConsentFields';
import { ProfileFormFields } from './ProfileFormFields';
import { useProfileForm } from '../useProfileForm';
import type { LinkableAccount, ProfileRequest } from '../../application/ports';
type NewProfileFormProps = {
  currentAccountId: string;
  accounts: LinkableAccount[];
  accountsLoading: boolean;
  accountsError: boolean;
  retry: () => void;
  pending: boolean;
  onSave: (body: ProfileRequest) => Promise<unknown>;
};
export function NewProfileForm({
  accounts,
  accountsLoading,
  accountsError,
  retry,
  pending,
  onSave,
  currentAccountId,
}: NewProfileFormProps) {
  const consent = useProfileConsentForm(currentAccountId);
  const { errors, error, save } = useProfileForm(pending, onSave, currentAccountId, consent.state.draft);
  return (
    <form
      noValidate
      onChange={consent.onChange}
      onSubmit={(event) => {
        event.preventDefault();
        void save(event.currentTarget);
      }}
      className="max-w-[640px] rounded-[20px] bg-white p-6 sm:p-8"
    >
      <fieldset disabled={pending} className="space-y-6">
        <ProfileFormFields
          errors={errors}
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          retry={retry}
          currentAccountId={currentAccountId}
        />
        <ConsentFields
          mode={consent.mode}
          draft={consent.state.draft}
          profileName={consent.state.displayName}
          onChange={consent.setDraft}
        />
        <p className="text-sm leading-6 text-[#55615f]">
          {consent.mode === 'invitation'
            ? 'Sau khi tạo, hãy mở thẻ hồ sơ trên Trang chủ để tạo link gửi chính người thân xác nhận.'
            : 'Bạn có thể bỏ tick và tạo hồ sơ trước; chỉ ghi được dữ liệu sức khỏe sau khi xác nhận đồng ý.'}
        </p>
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || consent.result.body === null}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] w-full"
        >
          {pending ? 'Đang lưu…' : 'Tạo hồ sơ'}
        </button>
      </fieldset>
    </form>
  );
}
