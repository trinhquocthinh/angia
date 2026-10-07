import { AdminIcon } from './AdminIcon';

export function AdminTopbar() {
  return (
    <header className="fixed top-0 left-60 right-0 z-40 h-16 flex items-center justify-between gap-4 py-0 px-6 bg-[#f0fcfbd9] backdrop-blur-lg shadow-[0_1px_8px_#0000000a] max-[900px]:static max-[900px]:py-0 max-[900px]:px-4">
      <div className="admin-topbar-brand flex items-center gap-4 text-[#004135] text-[16px] font-semibold tracking-[-0.025em] leading-[24px] [&_img]:w-9 [&_img]:h-9 [&_img]:object-contain max-[900px]:text-[14px] max-[900px]:gap-2 max-[900px]:[&_img]:w-7 max-[900px]:[&_img]:h-7">
        <span>Hồ Sơ Sức Khỏe Gia Đình</span>
      </div>
      <div className="flex items-center gap-4 max-[900px]:gap-2">
        <button
          type="button"
          className="admin-global-search inline-flex items-center gap-1 py-1.5 px-2 border-0 rounded-full bg-[#deebea] text-[#404945] text-[12px] font-semibold leading-[16px] max-[1199px]:[&_span:not(.admin-icon)]:hidden max-[600px]:hidden"
          disabled
          title="Chưa khả dụng"
        >
          <AdminIcon name="search" size={18} />
          <span>Tìm kiếm hồ sơ, đơn thuốc...</span>
        </button>
        <button
          type="button"
          className="admin-notifications inline-flex items-center justify-center w-9 h-9 border-0 rounded-full bg-transparent text-[#404945] max-[600px]:hidden"
          aria-label="Thông báo"
          disabled
          title="Chưa khả dụng"
        >
          <AdminIcon name="notifications" />
        </button>
      </div>
    </header>
  );
}
