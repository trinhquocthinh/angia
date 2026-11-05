import type { LinkableAccount } from '../../application/ports';
import { ProfileIdentityFields } from './ProfileIdentityFields';
type ProfileFormFieldsProps = {
  errors: { displayName?: string; birthYear?: string; linkedAccountId?: string };
  accounts: LinkableAccount[];
  accountsLoading: boolean;
  accountsError: boolean;
  retry: () => void;
  currentAccountId: string;
};
export function ProfileFormFields({
  errors,
  accounts,
  accountsLoading,
  accountsError,
  retry,
  currentAccountId,
}: ProfileFormFieldsProps) {
  return (
    <>
      <ProfileIdentityFields errors={errors} />
      <div>
        <label htmlFor="profile-account" className="text-sm font-semibold">
          Liên kết tài khoản <span className="font-normal text-[#707975]">(tùy chọn)</span>
        </label>
        <select
          id="profile-account"
          name="linkedAccountId"
          className="mt-1.5 block h-12 w-full rounded-xl border border-[#bfc9c4]/30 bg-[#eaf6f5] px-4 text-sm text-[#131d1d] max-md:border-[#bfc9c4]/60 max-md:bg-[#f8faf9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          disabled={accountsLoading || accountsError}
          aria-invalid={Boolean(errors.linkedAccountId)}
          aria-describedby={errors.linkedAccountId ? 'account-error' : undefined}
        >
          <option value="">Không liên kết tài khoản</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.id === currentAccountId
                ? `Đây là hồ sơ của tôi — ${account.displayName}`
                : account.displayName}
            </option>
          ))}
        </select>
        {errors.linkedAccountId && (
          <p id="account-error" className="mt-2 text-sm text-[#b42318]">
            {errors.linkedAccountId}
          </p>
        )}
        <p className="mt-1.5 text-xs leading-5 text-[#55615f]">
          Chỉ tài khoản trong gia đình chưa có hồ sơ liên kết được hiển thị.
        </p>
        {accountsLoading && (
          <p role="status" className="mt-2 text-sm">
            Đang tải tài khoản…
          </p>
        )}
        {accountsError && (
          <p role="alert" className="mt-2 text-sm text-[#b42318]">
            Không thể tải tài khoản.{' '}
            <button type="button" onClick={retry} className="min-h-11 underline">
              Thử lại
            </button>
          </p>
        )}
      </div>
    </>
  );
}
