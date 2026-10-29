import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
export function AddProfileTile() {
  return (
    <Link
      to="/profiles/new"
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#bfc9c4]/30 bg-[#eaf6f5] p-5 text-center shadow-sm transition-all duration-300 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] lg:min-h-[420px] lg:gap-0 lg:rounded-3xl lg:border-dashed lg:border-[#bfc9c4]/50 lg:bg-[#eaf6f5]/70 lg:p-8 lg:shadow-none lg:hover:-translate-y-1 lg:hover:bg-white lg:hover:shadow-lg lg:active:scale-100"
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#004135] shadow-sm transition-all duration-300 lg:mb-6 lg:h-20 lg:w-20 lg:rounded-full lg:shadow-md lg:group-hover:scale-105 lg:group-hover:bg-[#004135] lg:group-hover:text-white"
      >
        <span className="lg:hidden">
          <AdminIcon name="person_add" size={30} />
        </span>
        <span className="hidden lg:inline-flex">
          <AdminIcon name="add" size={36} />
        </span>
      </span>
      <div className="flex max-w-xs flex-col gap-0.5 lg:gap-2">
        <h2 className="text-lg leading-6 font-semibold text-[#131d1d] lg:text-[#004135]">
          Tạo hồ sơ thành viên mới
        </h2>
        <p className="text-[13px] leading-5 text-[#404945] lg:hidden">
          Thêm người thân vào sổ sức khỏe gia đình
        </p>
        <p className="hidden text-[15px] leading-6 text-[#404945] lg:block">
          Thêm ông bà, cha mẹ hoặc con nhỏ vào sổ gia đình để cùng chia sẻ và quản lý sức khỏe trọn vẹn.
        </p>
      </div>
      <span className="mt-1 inline-flex h-10 items-center gap-1 rounded-full bg-white px-5 text-xs font-semibold text-[#004135] shadow-sm transition-all duration-200 lg:mt-8 lg:h-auto lg:rounded-xl lg:border lg:border-[#bfc9c4]/30 lg:px-8 lg:py-3 lg:text-sm lg:group-hover:bg-[#004135] lg:group-hover:text-white">
        Thêm ngay
        <span className="lg:hidden">
          <AdminIcon name="chevron_right" size={16} />
        </span>
      </span>
    </Link>
  );
}
