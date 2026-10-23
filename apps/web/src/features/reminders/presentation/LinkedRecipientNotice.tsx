// BR-039: hồ sơ liên kết tài khoản nhận nhắc qua chính tài khoản đó, không đổi được nên chỉ hiển thị.
export function LinkedRecipientNotice({ displayName }: { displayName: string }) {
  return (
    <p className="rounded-xl bg-white p-5 text-sm text-[#404945] shadow-sm">
      Hồ sơ có tài khoản liên kết nên nhắc thuốc gửi tới tài khoản liên kết:{' '}
      <strong className="text-[#131d1d]">{displayName}</strong>.
    </p>
  );
}
