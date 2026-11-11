export function ActionSubmitBar({
  remove,
  pending,
  onClose,
}: {
  remove: boolean;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-accent text-on-accent text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_5%,transparent)] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-accent [&:hover]:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-shadow)_6%,transparent)] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none admin-button-secondary bg-accent-soft! text-text-secondary! [&:hover]:bg-border!"
        disabled={pending}
        onClick={onClose}
      >
        Hủy
      </button>
      <button
        type="submit"
        className={`admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-accent text-on-accent text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_5%,transparent)] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-accent [&:hover]:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-shadow)_6%,transparent)] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none ${remove ? 'admin-button-danger bg-danger! [&:hover]:bg-danger!' : ''}`}
        disabled={pending}
      >
        {pending ? (
          <>
            <span
              className="size-4 rounded-full border-2 border-surface/33 border-t-on-accent animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Đang lưu...
          </>
        ) : remove ? (
          'Xác nhận gỡ'
        ) : (
          'Lưu thay đổi'
        )}
      </button>
    </div>
  );
}
