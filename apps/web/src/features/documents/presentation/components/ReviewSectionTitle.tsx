import type { ReactNode } from 'react';

type ReviewSectionTitleProps = { id?: string; title: string; aside?: ReactNode; count?: string };

// Tiêu đề khối trong form duyệt: vạch nhấn + tên khối, bên phải là nhãn phụ hoặc số dòng (Stitch f4cfd385).
export function ReviewSectionTitle({ id, title, aside, count }: ReviewSectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 id={id} className="flex items-center gap-2 text-lg leading-6 font-semibold text-[#131d1d]">
        <span aria-hidden="true" className="h-4 w-1.5 shrink-0 rounded-full bg-[#004135]" />
        {title}
      </h2>
      {count && (
        <span className="shrink-0 rounded-full bg-[#20594b] px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
          {count}
        </span>
      )}
      {aside}
    </div>
  );
}
