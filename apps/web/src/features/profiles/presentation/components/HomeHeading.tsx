import { Link } from '@tanstack/react-router';
import { HomeBadges } from './HomeBadges';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Đầu trang Gia đình: nhãn sổ + tên gia đình, tiêu đề, nút tạo hồ sơ (desktop bố cục rộng, di động gọn một hàng).
export function HomeHeading({
  familyName,
  subtitle,
  canCreate,
}: {
  familyName: string | undefined;
  subtitle: string;
  canCreate: boolean;
}) {
  return (
    <section className="flex flex-col gap-6 pb-2 lg:mb-10">
      <HomeBadges familyName={familyName} />
      <div className="flex items-center justify-between gap-3 lg:items-end lg:gap-6">
        <div className="flex min-w-0 flex-col gap-0.5 lg:gap-1.5">
          <div className="flex min-w-0 items-center gap-2 lg:items-baseline lg:gap-3">
            <h1 className="auth-heading truncate text-2xl leading-8 font-semibold tracking-tight text-[#004135] lg:text-4xl lg:leading-[44px] lg:font-medium">
              Gia đình
            </h1>
            {familyName && (
              <span className="max-w-full shrink-0 truncate rounded-full bg-[#aef0da] px-2.5 py-0.5 text-xs font-semibold text-[#2f6f5e] lg:hidden">
                {familyName}
              </span>
            )}
            <span className="hidden text-[15px] text-[#404945] lg:inline">{subtitle}</span>
          </div>
          <p className="truncate text-[13px] leading-5 text-[#404945] lg:hidden">{subtitle}</p>
          <p className="hidden max-w-xl text-[13px] leading-5 text-[#404945] lg:block">
            Sổ y bạ cho từng thành viên: lưu giấy tờ khám, đơn thuốc và chỉ số sức khỏe của người thân trong
            một nơi.
          </p>
        </div>
        {canCreate && (
          <Link
            to="/profiles/new"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#004135] px-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] lg:h-auto lg:gap-2.5 lg:px-6 lg:py-3.5 lg:shadow-md lg:hover:-translate-y-0.5 lg:hover:bg-[#20594b] lg:hover:shadow-lg"
          >
            <span className="lg:hidden">
              <AdminIcon name="add" />
            </span>
            <span className="hidden lg:inline-flex">
              <AdminIcon name="person_add" />
            </span>
            Tạo hồ sơ mới
          </Link>
        )}
      </div>
    </section>
  );
}
