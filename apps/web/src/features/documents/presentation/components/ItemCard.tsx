import type { ReactNode } from 'react';
import { DocumentIcon } from './DocumentIcon';

type ItemCardProps = {
  // Tiền tố id khối dòng; tóm tắt dòng lỗi liên kết tới `#${anchorPrefix}-${index}`.
  anchorPrefix: string;
  index: number;
  title: string;
  invalid: boolean;
  onRemove: (() => void) | null;
  children: ReactNode;
};

// Khối một dòng của form nhiều dòng (thuốc, chỉ số xét nghiệm): số thứ tự, tiêu đề, nút xóa dòng;
// viền đỏ khi dòng còn thiếu thông tin để dễ thấy vị trí lỗi.
export function ItemCard({ anchorPrefix, index, title, invalid, onRemove, children }: ItemCardProps) {
  const id = `${anchorPrefix}-${index}`;
  const order = index + 1;
  return (
    <li
      id={id}
      aria-labelledby={`${id}-title`}
      className={`flex scroll-mt-24 flex-col gap-4 rounded-2xl bg-[#f6fbfa] p-4 outline-2 lg:p-5 ${
        invalid ? 'outline-[#b42318]' : 'outline-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#004135] text-xs font-bold text-white"
        >
          {order}
        </span>
        <h3 id={`${id}-title`} className="flex-1 text-sm font-semibold text-[#286958]">
          {title}
        </h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Xóa dòng ${order}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#55615f] hover:bg-[#e4f0f0] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
          >
            <DocumentIcon name="close" size={18} />
          </button>
        )}
      </div>
      {children}
    </li>
  );
}
