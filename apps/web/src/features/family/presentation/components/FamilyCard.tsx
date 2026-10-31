import type { Account, Family } from '../../application/ports';
import { AdminIcon } from './AdminIcon';

const names = (accounts: Account[], empty: string) =>
  accounts.map((account) => account.displayName).join(', ') || empty;

// BR-003: chỉ hiện số liệu tài khoản; không đếm hồ sơ, chứng từ hay đơn thuốc của gia đình.
export function FamilyCard({
  family,
  accounts,
  currentFamilyId,
}: {
  family: Family;
  accounts: Account[];
  currentFamilyId: string | null;
}) {
  const members = accounts.filter((account) => account.familyId === family.id);
  const mains = members.filter((account) => account.role === 'main');
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-[#eaf6f5]/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#004135] text-white shadow-sm">
          <AdminIcon name="home_health" size={24} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="auth-heading m-0 text-xl leading-7 font-semibold text-[#004135] [overflow-wrap:anywhere]">
              {family.name}
            </h3>
            {currentFamilyId === family.id && (
              <span className="rounded-full bg-[#aef0da] px-2 py-0.5 text-[11px] leading-4 font-semibold text-[#004135]">
                Nhóm của bạn
              </span>
            )}
          </div>
          <p className="m-0 text-xs leading-5 text-[#55615f]">
            Tạo ngày{' '}
            {new Date(family.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
          </p>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-white p-3">
          <dt className="flex items-center gap-1 text-xs leading-4 text-[#404945]">
            <AdminIcon name="group" size={14} /> {members.length} tài khoản
          </dt>
          <dd className="m-0 mt-1 text-[13px] leading-5 font-medium text-[#131d1d] [overflow-wrap:anywhere]">
            {names(members, 'Chưa có thành viên')}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-white p-3">
          <dt className="flex items-center gap-1 text-xs leading-4 text-[#404945]">
            <AdminIcon name="verified_user" size={14} /> {mains.length} Quản trị chính
          </dt>
          <dd className="m-0 mt-1 text-[13px] leading-5 font-medium text-[#131d1d] [overflow-wrap:anywhere]">
            {names(mains, 'Chưa có Quản trị chính')}
          </dd>
        </div>
      </dl>
    </article>
  );
}
