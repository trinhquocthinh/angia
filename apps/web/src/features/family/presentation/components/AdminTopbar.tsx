import { Link } from '@tanstack/react-router';
import { HeaderSearch } from '@src/shared/ui/HeaderSearch';
import { filterByName } from '@src/shared/utils/text/filterByName';
import type { Account } from '../../application/ports';
import { AdminIcon } from './AdminIcon';

// Header quản trị: tìm tài khoản theo tên (chọn → lọc bảng tài khoản) và lối tắt tới cài đặt thông báo.
export function AdminTopbar({
  accounts,
  hasFamily,
  onFindAccount,
}: {
  accounts: Account[];
  hasFamily: boolean;
  onFindAccount: (name: string) => void;
}) {
  return (
    <header className="fixed top-0 left-60 right-0 z-40 h-16 flex items-center justify-between gap-4 py-0 px-6 bg-[#f0fcfbd9] backdrop-blur-lg shadow-[0_1px_8px_#0000000a] max-[900px]:static max-[900px]:py-0 max-[900px]:px-4">
      <div className="admin-topbar-brand flex items-center gap-4 text-[#004135] text-[16px] font-semibold tracking-[-0.025em] leading-[24px] max-[900px]:text-[14px]">
        <span>Hồ Sơ Sức Khỏe Gia Đình</span>
      </div>
      <div className="flex items-center gap-2">
        <HeaderSearch
          className="w-72 max-[600px]:hidden"
          label="Tìm tài khoản"
          placeholder="Tìm tài khoản theo tên…"
          emptyText="Không có tài khoản trùng tên."
          search={(query) =>
            filterByName(accounts, query, (account) => account.displayName).map((account) => ({
              id: account.id,
              label: account.displayName,
              hint: account.familyId ? undefined : 'Chưa vào nhóm',
            }))
          }
          onSelect={(item) => onFindAccount(item.label)}
        />
        {hasFamily && (
          <Link
            to="/notifications"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#404945] transition-colors hover:bg-[#e4f0f0] hover:text-[#004135]"
            aria-label="Cài đặt thông báo"
            title="Cài đặt thông báo"
          >
            <AdminIcon name="notifications" />
          </Link>
        )}
      </div>
    </header>
  );
}
