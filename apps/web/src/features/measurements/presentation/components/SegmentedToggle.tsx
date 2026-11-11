import { useLayoutEffect, useRef, useState } from 'react';
import { indicatorStyle } from '@src/shared/ui/indicatorStyle';

type SegmentedToggleProps<T extends string | number> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

// Nhóm nút chọn một (chỉ số, khoảng tuần): nền trắng trượt tới nút đang chọn (§11.4.1), aria-pressed cho trình đọc màn hình.
export function SegmentedToggle<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const measured = useRef(false);
  const [style, setStyle] = useState(() => indicatorStyle(null, false));

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const pressed = group.querySelector<HTMLElement>('[aria-pressed="true"]');
      setStyle(indicatorStyle(pressed, measured.current));
      measured.current = pressed !== null;
    };
    measure();
    // Phông tải xong hoặc phóng chữ làm nút đổi bề rộng: đo lại.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(group);
    return () => observer?.disconnect();
  }, [value]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={label}
      className="relative inline-flex rounded-xl bg-accent-soft p-1"
    >
      <span
        aria-hidden="true"
        className="angia-slide-indicator absolute inset-y-1 left-0 rounded-lg bg-surface shadow-sm"
        style={style}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="relative min-h-11 rounded-lg px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary aria-pressed:font-semibold aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
