import { Link } from '@tanstack/react-router';
import { AdminIcon } from './AdminIcon';

export function SidebarOverview() {
  return (
    <nav className="grid gap-1 py-0 px-1 max-[900px]:flex max-[900px]:overflow-x-auto" aria-label="Tổng quan">
      <p className="text-[11px] leading-[14px] tracking-[0.05em] uppercase text-[#707975] font-semibold py-1 px-2 m-0 max-[900px]:hidden">
        Tổng quan
      </p>
      <Link
        to="/"
        className="admin-nav-link flex items-center gap-2 min-h-10 p-2 border-0 rounded-[12px] bg-transparent text-[#404945] no-underline text-[14px] font-medium text-left transition-[background-color,color] duration-[160ms] ease-[ease] cursor-pointer [&:hover]:bg-[#e4f0f0] [&:hover]:text-[#131d1d] [&:disabled]:opacity-65 [&:disabled]:cursor-default max-[900px]:shrink-0"
      >
        <AdminIcon name="home_health" />
        <span>Nhà (Gia đình)</span>
      </Link>
      <button
        type="button"
        className="admin-nav-link flex items-center gap-2 min-h-10 p-2 border-0 rounded-[12px] bg-transparent text-[#404945] no-underline text-[14px] font-medium text-left transition-[background-color,color] duration-[160ms] ease-[ease] cursor-pointer [&:hover]:bg-[#e4f0f0] [&:hover]:text-[#131d1d] [&:disabled]:opacity-65 [&:disabled]:cursor-default max-[900px]:shrink-0"
        disabled
        title="Chưa khả dụng"
      >
        <AdminIcon name="add_a_photo" />
        <span>Thêm (Tải ảnh)</span>
      </button>
      <button
        type="button"
        className="admin-nav-link flex items-center gap-2 min-h-10 p-2 border-0 rounded-[12px] bg-transparent text-[#404945] no-underline text-[14px] font-medium text-left transition-[background-color,color] duration-[160ms] ease-[ease] cursor-pointer [&:hover]:bg-[#e4f0f0] [&:hover]:text-[#131d1d] [&:disabled]:opacity-65 [&:disabled]:cursor-default max-[900px]:shrink-0"
        disabled
        title="Chưa khả dụng"
      >
        <AdminIcon name="pending_actions" />
        <span>Chờ duyệt</span>
      </button>
    </nav>
  );
}
