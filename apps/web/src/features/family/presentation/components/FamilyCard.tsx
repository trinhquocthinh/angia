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
    <article className="flex flex-col gap-3 rounded-2xl border border-border/35 bg-bg p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-stitch-sm">
          <AdminIcon name="home_health" size={24} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="auth-heading m-0 text-heading-2 font-semibold text-accent [overflow-wrap:anywhere]">
              {family.name}
            </h3>
            {currentFamilyId === family.id && (
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-caption font-semibold text-on-secondary-container">
                Nhóm của bạn
              </span>
            )}
          </div>
          <p className="m-0 text-caption text-text-secondary tabular-nums">
            Tạo ngày{' '}
            {new Date(family.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
          </p>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border/30 bg-surface p-3.5">
          <dt className="flex items-center gap-1 text-caption text-text-secondary tabular-nums">
            <AdminIcon name="group" size={14} /> {members.length} tài khoản
          </dt>
          <dd className="m-0 mt-1 text-caption font-medium text-text-primary [overflow-wrap:anywhere]">
            {names(members, 'Chưa có thành viên')}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border/30 bg-surface p-3.5">
          <dt className="flex items-center gap-1 text-caption text-text-secondary tabular-nums">
            <AdminIcon name="verified_user" size={14} /> {mains.length} Quản trị chính
          </dt>
          <dd className="m-0 mt-1 text-caption font-medium text-text-primary [overflow-wrap:anywhere]">
            {names(mains, 'Chưa có Quản trị chính')}
          </dd>
        </div>
      </dl>
    </article>
  );
}
