type Props = { error: boolean; errorId: string };
export function PrivacyCoordinateHint({ error, errorId }: Props) {
  return (
    <>
      {error && (
        <p id={errorId} role="alert" className="col-span-2 text-xs leading-5 text-[#9b472c]">
          Nhập số hợp lệ từ 0 đến 100%; Rộng/Cao phải lớn hơn 0 và vùng phải nằm trong ảnh. Vùng che không tự
          thu nhỏ khi vượt mép. Sửa ô đang báo lỗi hoặc nhấn Esc trước khi chỉnh ô khác.
        </p>
      )}
      <p className="col-span-2 text-xs leading-5 text-[#55615f]">
        Nhấn Enter hoặc rời ô để áp dụng. Esc để bỏ giá trị đang nhập.
      </p>
    </>
  );
}
