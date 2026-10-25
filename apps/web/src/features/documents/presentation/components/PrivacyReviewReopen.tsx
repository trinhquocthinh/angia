// Thay hộp thoại kiểm tra sau khi người dùng đóng để chỉnh ảnh: mở lại đúng bản kiểm tra hiện có.
export function PrivacyReviewReopen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6e5df] bg-white p-4">
      <p className="text-sm text-[#404945]">Bản kiểm tra đã sẵn sàng. Mở lại để xem ảnh và xác nhận gửi.</p>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 rounded-xl bg-[#286958] px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        Mở bản kiểm tra
      </button>
    </div>
  );
}
