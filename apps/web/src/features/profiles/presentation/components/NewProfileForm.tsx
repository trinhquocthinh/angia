import { ProfileFormFields } from './ProfileFormFields';
import { useProfileForm } from '../useProfileForm';
import type { LinkableAccount, ProfileRequest } from '../../application/ports';
export function NewProfileForm({
  accounts,
  accountsLoading,
  accountsError,
  retry,
  pending,
  onSave,
}: {
  accounts: LinkableAccount[];
  accountsLoading: boolean;
  accountsError: boolean;
  retry: () => void;
  pending: boolean;
  onSave: (body: ProfileRequest) => Promise<unknown>;
}) {
  const { errors, error, save } = useProfileForm(pending, onSave);
  return (
    <form
      noValidate
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
        />
        <p className="text-sm leading-6 text-[#55615f]">
          Hồ sơ mới chưa có đồng thuận. Bạn có thể xác nhận riêng trên trang Nhà sau khi tạo.
        </p>
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] w-full"
        >
          {pending ? 'Đang lưu…' : 'Tạo hồ sơ'}
        </button>
      </fieldset>
    </form>
  );
}
