import { Link } from '@tanstack/react-router';
export function AddProfileTile() {
  return (
    <Link
      to="/profiles/new"
      className="flex min-h-[280px] flex-col items-center justify-center rounded-[20px] bg-[#eaf6f5] p-6 text-center text-[#004135] shadow-sm"
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-4xl"
      >
        +
      </span>
      <h2 className="mt-5 text-lg font-semibold">Tạo hồ sơ thành viên mới</h2>
      <p className="mt-3 text-sm leading-6 text-[#55615f]">Thêm người thân vào sổ gia đình.</p>
      <span className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold">Thêm ngay</span>
    </Link>
  );
}
