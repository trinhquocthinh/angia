export function AiRoutingRuntimeNotice() {
  return (
    <details className="rounded-xl bg-[#eaf6f5] px-3 py-2 text-xs leading-5 text-[#404945]">
      <summary className="cursor-pointer font-semibold text-[#004135]">Khi nào cấu hình có hiệu lực?</summary>
      <p className="mt-1 mb-0">
        Worker đọc cấu hình ở lượt xử lý tiếp theo; lượt đang chạy giữ cấu hình đã nhận. Chế độ giả lập không
        gọi dịch vụ thật. Nhận diện thật chỉ qua OpenRouter (không lưu dữ liệu) khi worker ở chế độ thật và đã
        có khóa dịch vụ.
      </p>
    </details>
  );
}
