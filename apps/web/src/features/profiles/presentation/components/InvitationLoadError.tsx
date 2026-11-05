export function InvitationLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert">
      <p className="text-sm leading-7">Không thể mở link. Vui lòng kiểm tra kết nối rồi thử lại.</p>
      <button
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-xl bg-[#004135] px-5 py-3 text-sm text-white"
      >
        Thử lại
      </button>
    </div>
  );
}
