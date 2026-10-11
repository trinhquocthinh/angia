import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  titleId: string;
  title: string;
  subtitle: string;
  closeLabel: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
};

// Side panel thuốc theo Stitch f29c92d0: phải màn hình ở desktop, đáy màn hình ở mobile; đầu cố định,
// thân cuộn riêng. Trả focus về nút mở khi đóng; chặn Escape/đóng khi đang lưu.
export function MedicationDrawer({
  titleId,
  title,
  subtitle,
  closeLabel,
  pending,
  onClose,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[490px] max-w-full flex-col border-0 border-l border-[#d9e5e4] bg-white p-0 text-[#131d1d] shadow-[-8px_0_32px_rgba(22,62,52,0.08)] backdrop:bg-[#131d1d]/40 open:flex max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px] max-md:border-l-0"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#d9e5e4] px-6 py-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold text-[#131d1d]">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-[#55615f]">{subtitle}</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          aria-label={closeLabel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d9e5e4] text-[#55615f] hover:bg-[#eaf6f5] hover:text-[#131d1d] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </dialog>
  );
}
