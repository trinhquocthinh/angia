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
        className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none admin-button-secondary bg-[#e4f0f0]! text-[#404945]! [&:hover]:bg-[#d9e5e4]!"
        disabled={pending}
        onClick={onClose}
      >
        Hủy
      </button>
      <button
        type="submit"
        className={`admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none ${remove ? 'admin-button-danger bg-[#ba1a1a]! [&:hover]:bg-[#93000a]!' : ''}`}
        disabled={pending}
      >
        {pending ? (
          <>
            <span
              className="size-4 rounded-full border-2 border-[#ffffff55] border-t-white animate-spin motion-reduce:animate-none"
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
