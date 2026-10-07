// Design §6 `/review/:id` trạng thái loading: AI đang đọc ảnh vừa tải; form tự hiện khi có bản trích xuất.
export function ExtractingPlaceholder() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex flex-col gap-5 rounded-[20px] bg-white p-5 lg:p-6"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-[#004135]">
        <span
          aria-hidden="true"
          className="h-2 w-2 animate-pulse rounded-full bg-[#286958] motion-reduce:animate-none"
        />
        Đang phân tích hình ảnh… thường dưới 15 giây
      </p>
      <p className="text-sm text-[#55615f]">
        Bạn có thể đối chiếu ảnh bên cạnh trong lúc chờ; thông tin sẽ tự hiện ở đây.
      </p>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-12 animate-pulse rounded-xl bg-[#eaf6f5] motion-reduce:animate-none" />
        ))}
      </div>
    </section>
  );
}
