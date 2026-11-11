import { revealStyle } from '@src/shared/ui/revealStyle';
import { DocumentIcon } from './DocumentIcon';

const STEPS = ['Chọn ảnh', 'Cắt & Che định danh', 'Xem trước & Xác nhận'];

// Chỉ báo, không phải tab: bước 2–3 áp dụng cho từng ảnh nên chỉ mở được từ nút "Che thông tin" trên ô ảnh.
export function UploadStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol
      aria-label="Các bước thêm giấy tờ"
      className="angia-modal-reveal grid grid-cols-3 gap-1.5 rounded-2xl bg-border/60 p-1.5"
      style={revealStyle(4)}
    >
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-center text-xs font-semibold leading-4 sm:flex-row sm:gap-2 sm:text-sm ${
              active ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums ${
                active
                  ? 'angia-modal-pop bg-accent text-on-accent'
                  : step < current
                    ? 'bg-accent-soft text-accent'
                    : 'bg-accent-soft text-text-primary'
              }`}
            >
              {step < current ? <DocumentIcon name="check" size={14} /> : step}
            </span>
            <span>
              <span className="hidden lg:inline">Bước {step}: </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
