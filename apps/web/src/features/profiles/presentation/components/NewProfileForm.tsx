import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { useProfileConsentForm } from '../useProfileConsentForm';
import { ConsentFields } from './ConsentFields';
import { NewProfileSubmit } from './NewProfileSubmit';
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
      className="min-h-0 flex-1 overflow-y-auto border-t border-[#e4f0f0] px-6 pt-5 max-md:px-5"
    >
      <fieldset disabled={pending} className="space-y-5">
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
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-[#55615f]">
          <span className="mt-0.5 shrink-0 text-[#707975]">
            <AdminIcon name="info" size={16} />
          </span>
          {consent.mode === 'invitation'
            ? 'Sau khi tạo, hãy mở thẻ hồ sơ trên Trang chủ để tạo link gửi chính người thân xác nhận.'
            : 'Bạn có thể bỏ tick và tạo hồ sơ trước; chỉ ghi được dữ liệu sức khỏe sau khi xác nhận đồng ý.'}
        </p>
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <NewProfileSubmit disabled={pending || consent.result.body === null} pending={pending} />
      </fieldset>
    </form>
  );
}
