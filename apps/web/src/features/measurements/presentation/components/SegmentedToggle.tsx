import { useLayoutEffect, useRef, useState } from 'react';
import { indicatorStyle } from '@src/shared/ui/indicatorStyle';

type SegmentedToggleProps<T extends string | number> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

// Nhóm nút chọn một theo chuẩn 3D Bento v2.0 (Stitch c5e09b60 / d782695b): full-width cân đối trên mobile, pill gọn trên desktop.
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
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(group);
    return () => observer?.disconnect();
  }, [value]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={label}
      className="relative grid w-full auto-cols-fr grid-flow-col rounded-[18px] bg-surface-container-high p-1.5 md:inline-flex md:w-auto"
    >
      <span
        aria-hidden="true"
        className="angia-slide-indicator absolute inset-y-1.5 left-0 rounded-[14px] bg-surface shadow-sm"
        style={style}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="relative flex min-h-btn items-center justify-center rounded-[14px] px-3.5 text-center text-button-secondary font-semibold whitespace-nowrap text-text-secondary transition-colors hover:text-text-primary aria-pressed:font-bold aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:px-5"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
