import { revealStyle } from '@src/shared/ui/revealStyle';
import { DocumentIcon } from './DocumentIcon';

const STEPS = ['Chọn ảnh', 'Cắt & che thông tin', 'Xem trước & xác nhận'];

// Chỉ báo, không phải tab: bước 2–3 áp dụng cho từng ảnh nên chỉ mở được từ nút "Che thông tin" trên ô ảnh.
export function UploadStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Các bước thêm giấy tờ" className="angia-modal-reveal flex" style={revealStyle(3)}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1.5 px-1 text-center text-xs leading-4 sm:text-[13px] ${
              active ? 'font-semibold text-[#004135]' : 'font-medium text-[#55615f]'
            }`}
          >
            {step < STEPS.length && (
              <span
                aria-hidden="true"
                className="absolute top-[13px] left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] overflow-hidden rounded-full bg-[#deebea]"
              >
                {step < current && <span className="upload-meter-fill block h-full bg-[#286958]" />}
              </span>
            )}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                active
                  ? 'angia-modal-pop bg-[#004135] text-white shadow-[0_0_0_4px_#aef0da80]'
                  : step < current
                    ? 'bg-[#aef0da] text-[#004135]'
                    : 'bg-[#e4f0f0] text-[#404945]'
              }`}
            >
              {step < current ? <DocumentIcon name="check" size={14} /> : step}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
