import { PushIcon } from './PushIcon';

// Mô phỏng đúng nội dung public/sw.js gửi ra: tiêu đề "AN GIA", nội dung "Đến giờ dùng thuốc", không kèm chi tiết.
export function LockScreenPreview() {
  return (
    <section className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_#1f2a2a0f] lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#131d1d]">
          <span className="text-[#004135]">
            <PushIcon name="phone" />
          </span>
          Mô phỏng màn hình khóa
        </h2>
        <span className="shrink-0 rounded-full bg-[#e4f0f0] px-2.5 py-0.5 text-xs whitespace-nowrap text-[#404945]">
          Bảo vệ riêng tư
        </span>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[#dce8e7] to-[#cfe3df] p-3.5" aria-hidden="true">
        <div className="mb-2 px-1 text-xs font-semibold text-[#404945]">12:30</div>
        <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 shadow-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#004135] text-white">
            <PushIcon name="pill" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#004135]">AN GIA</span>
              <span className="text-[#707975]">Bây giờ</span>
            </div>
            <p className="mt-0.5 text-base font-semibold text-[#131d1d]">Đến giờ dùng thuốc</p>
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-[#404945] italic">
        <span className="mt-0.5 not-italic">
          <PushIcon name="lock" size={14} />
        </span>
        Tên thuốc, liều lượng và thành viên không hiện trên màn hình khóa — chỉ xem được sau khi đăng nhập AN
        GIA.
      </p>
    </section>
  );
}
