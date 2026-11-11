type Props = {
  name: string;
  value: 'replace' | 'parallel';
  checked: boolean;
  onChange: () => void;
};

const COPY = {
  replace: { label: 'Thay thế', detail: 'Đóng tất cả đợt đang có hiệu lực vào ngày trước đợt mới.' },
  parallel: { label: 'Dùng song song', detail: 'Giữ nguyên tất cả đợt đang có hiệu lực và thêm đợt mới.' },
};

// Thẻ lựa chọn dạng radio: input thật (sr-only) giữ bàn phím/đọc màn hình; dấu chọn bật nhẹ khi chọn.
export function CourseResolutionOption({ name, value, checked, onChange }: Props) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 transition-[background-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus motion-reduce:transition-none ${
        checked ? 'bg-accent-soft ring-2 ring-focus' : 'bg-surface ring-border hover:bg-surface'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent text-on-accent' : 'border-2 border-border bg-surface'
        }`}
      >
        {checked && (
          <svg
            className="angia-modal-pop"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-text-primary">{COPY[value].label}</span>
        <span className="block text-[13px] leading-5 text-text-secondary">{COPY[value].detail}</span>
      </span>
    </label>
  );
}
