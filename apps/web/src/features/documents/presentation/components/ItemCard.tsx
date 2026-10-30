import '@src/shared/ui/modal-motion.css';
import { revealStyle } from '@src/shared/ui/revealStyle';
import { useId, type ReactNode } from 'react';
import { DocumentIcon } from './DocumentIcon';
import { withRowTransition } from './withRowTransition';
import './review-motion.css';

// Đơn dài vẫn hiện xong dưới nửa giây thay vì so le đến dòng cuối.
const MAX_REVEAL_INDEX = 3;

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
  // Tên cố định theo từng thẻ (không theo số thứ tự) để View Transition biết thẻ nào trượt đi đâu.
  const transitionName = `review-row-${useId().replace(/\W/g, '')}`;
  return (
    <li
      id={id}
      aria-labelledby={`${id}-title`}
      style={{ ...revealStyle(Math.min(index, MAX_REVEAL_INDEX)), viewTransitionName: transitionName }}
      className={`angia-modal-reveal flex scroll-mt-24 flex-col gap-4 rounded-[20px] bg-white p-4 shadow-card outline-2 transition-[outline-color] duration-200 [view-transition-class:review-row] motion-reduce:transition-none lg:p-5 ${
        invalid ? 'outline-[#b42318]' : 'outline-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#20594b] text-xs font-bold text-white"
        >
          {order}
        </span>
        <h3 id={`${id}-title`} className="flex-1 text-[15px] font-semibold text-[#004135]">
          {title}
        </h3>
        {onRemove && (
          <button
            type="button"
            onClick={() => withRowTransition(onRemove)}
            aria-label={`Xóa dòng ${order}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#55615f] transition-colors duration-200 hover:bg-[#e4f0f0] hover:text-[#b42318] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
          >
            <DocumentIcon name="close" size={18} />
          </button>
        )}
      </div>
      {children}
    </li>
  );
}
