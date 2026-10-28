export function AiRoutingRuntimeNotice() {
  return (
    <p className="m-0 rounded-xl bg-[#f4f7f5] px-3 py-2 text-[12px] leading-5 text-[#55615f]">
      Worker đọc cấu hình ở lượt xử lý tiếp theo; lượt đang chạy giữ cấu hình đã nhận. Chế độ giả lập không
      gọi dịch vụ thật. Nhận diện thật chỉ qua OpenRouter (không lưu dữ liệu) khi worker ở chế độ thật và đã
      có khóa dịch vụ.
    </p>
  );
}
