import { AdminIcon } from './AdminIcon';

export function AdminHeading({
  families,
  accounts,
  disabled,
  onCreate,
}: {
  families: number;
  accounts: number;
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-4 pb-1 max-[600px]:items-stretch max-[600px]:flex-col max-[600px]:gap-3 admin-reveal">
      <div className="admin-page-title flex flex-col gap-1 min-w-0 [&_>_p]:m-0 [&_>_p]:text-[#404945] [&_>_p]:text-[15px] [&_>_p]:leading-[24px]">
        <div className="">
          <span className="admin-system-badge inline-flex items-center gap-1 py-0.5 px-[10px] rounded-full bg-[#aef0da] text-[#2f6f5e] text-[11px] font-semibold uppercase tracking-[0.04em] leading-[14px] [&_>_span]:w-[6px] [&_>_span]:h-[6px] [&_>_span]:rounded-full [&_>_span]:bg-[#286958]">
            <span />
            Hệ thống quản trị
          </span>
        </div>
        <h1>Quản trị hệ thống</h1>
        <p>
          {families} nhóm gia đình · {accounts} tài khoản người dùng · Kiểm soát phân quyền
        </p>
      </div>
      <button
        type="button"
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none h-13 shrink-0"
        disabled={disabled}
        onClick={onCreate}
      >
        <AdminIcon name="group_add" />+ Tạo nhóm gia đình
      </button>
    </div>
  );
}
