import { AdminIcon } from './AdminIcon';

export function AdminHeading({
  families,
  accounts,
  waiting,
  disabled,
  onCreate,
}: {
  families: number;
  accounts: number;
  waiting: number;
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-4 max-[600px]:items-stretch max-[600px]:flex-col max-[600px]:gap-3 admin-reveal">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="m-0 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#286958]">
          <AdminIcon name="admin_panel_settings" size={16} /> Hệ thống quản trị
        </p>
        <h1 className="auth-heading m-0 text-[28px] leading-tight font-semibold tracking-tight text-[#004135] sm:text-4xl">
          Quản trị hệ thống
        </h1>
        <p className="m-0 text-[15px] leading-6 text-[#404945]">
          {families} nhóm gia đình · {accounts} tài khoản
          {waiting > 0 && ` · ${waiting} tài khoản chờ vào nhóm`}
        </p>
      </div>
      <button
        type="button"
        className="admin-button inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[#004135] px-5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[#20594b]"
        disabled={disabled}
        onClick={onCreate}
      >
        <AdminIcon name="group_add" />
        Tạo nhóm gia đình
      </button>
    </div>
  );
}
