import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

const textAction =
  'inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] lg:h-auto lg:bg-transparent lg:px-1 lg:font-medium';

// Chân thẻ hồ sơ: di động một hàng [Xóa][Xem], desktop xếp dọc [Xem chi tiết] rồi [Xóa] (nút xóa luôn ở cuối, SPEC-007).
// Hồ sơ của chính tài khoản có thêm [Rút đồng thuận] cùng hàng, đối diện bên trái để nút xóa vẫn ở cuối (SPEC-036).
export function ProfileCardActions({
  profileId,
  onDelete,
  onWithdraw,
}: {
  profileId: string;
  onDelete: () => void;
  onWithdraw?: (() => void) | undefined;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#eaf6f5] pt-3 lg:mt-auto lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-[#e4f0f0] lg:pt-4">
      <Link
        to="/profiles/$profileId"
        params={{ profileId }}
        className="order-2 flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#004135] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] lg:order-1 lg:flex-none lg:gap-2 lg:bg-[#e4f0f0] lg:text-[#004135] lg:hover:bg-[#004135] lg:hover:text-white"
      >
        Xem hồ sơ chi tiết
        <span className="lg:hidden">
          <AdminIcon name="arrow_forward" size={18} />
        </span>
        <span className="hidden lg:inline-flex">
          <AdminIcon name="arrow_outward" size={18} />
        </span>
      </Link>
      <div
        className={`flex items-center justify-between gap-3 lg:order-2 ${onWithdraw ? 'order-3 basis-full' : 'order-1'}`}
      >
        {onWithdraw && (
          <button
            type="button"
            className={`${textAction} bg-[#eaf6f5] text-[#404945] active:bg-[#e4f0f0] hover:text-[#004135]`}
            onClick={onWithdraw}
          >
            <AdminIcon name="shield" size={18} />
            Rút đồng thuận
          </button>
        )}
        <button
          type="button"
          className={`${textAction} bg-[#ffdad6]/40 text-[#ba1a1a] active:bg-[#ffdad6] hover:text-[#93000a]`}
          onClick={onDelete}
        >
          <span className="lg:hidden">
            <AdminIcon name="delete" size={18} />
          </span>
          <span className="hidden lg:inline-flex">
            <AdminIcon name="delete_outline" size={18} />
          </span>
          Xóa hồ sơ
        </button>
      </div>
    </div>
  );
}
