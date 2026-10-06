import { Link } from '@tanstack/react-router';

export function SidebarHeader() {
  return (
    <div className="pt-1 px-2 pb-0">
      <Link
        to="/admin"
        className="admin-brand flex gap-2 items-center text-[#004135] no-underline font-bold text-[18px] tracking-[-0.025em] leading-[22px] [&_img]:w-14 [&_img]:h-14 [&_img]:object-contain [&_small]:block [&_small]:text-[10px] [&_small]:leading-[14px] [&_small]:tracking-[0.06em] [&_small]:uppercase [&_small]:text-[#286958] [&_small]:font-semibold"
      >
        <img src="/logo.png" alt="" />
        <span>
          AN GIA<small>Sổ sức khỏe gia đình</small>
        </span>
      </Link>
      <p className="mt-2 mx-0 mb-0 py-0 px-1 font-sans italic font-medium text-[11px] leading-[18px] text-[#404945] max-[900px]:hidden">
        “Chăm chút từng thói quen, chở che từng thế hệ.”
      </p>
    </div>
  );
}
