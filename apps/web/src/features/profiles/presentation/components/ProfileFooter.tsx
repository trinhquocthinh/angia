import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Chưa có trang hướng dẫn/trợ giúp: giữ chỗ theo thiết kế, ở trạng thái vô hiệu.
const soon = 'inline-flex cursor-not-allowed items-center gap-1 opacity-60';

export function ProfileFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-4 border-border pb-[calc(6rem+env(safe-area-inset-bottom))] lg:mt-12 lg:border-t lg:bg-accent-soft lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 pt-8 pb-10 text-center text-[13px] leading-5 text-text-secondary lg:flex-row lg:justify-between lg:gap-4 lg:px-8 lg:py-0 lg:text-left">
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-lg font-bold text-accent">AN GIA</span>
          <span className="text-text-secondary">•</span>
          <span>Sổ Sức Khỏe Gia Đình</span>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm font-medium text-accent lg:text-xs lg:font-semibold lg:text-text-secondary">
          <span aria-disabled="true" title="Sắp ra mắt" className={soon}>
            <span className="lg:hidden">
              <AdminIcon name="menu_book" size={18} />
            </span>
            Hướng dẫn sử dụng
          </span>
          <span aria-hidden="true" className="text-text-secondary lg:hidden">
            •
          </span>
          <span aria-disabled="true" title="Sắp ra mắt" className={soon}>
            <span className="lg:hidden">
              <AdminIcon name="help" size={18} />
            </span>
            Trung tâm trợ giúp
          </span>
        </div>
        <p className="text-xs text-text-secondary lg:text-[11px] lg:tracking-[0.03em]">
          AN GIA © {year} • Sổ Sức Khỏe Gia Đình. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
