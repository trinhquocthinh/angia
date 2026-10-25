import { InvitationIcon } from './InvitationIcon';
export function InvitationExpiry({ expiresAt }: { expiresAt: string }) {
  const time = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(expiresAt));
  return (
    <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-[#eaf6f5] px-3 py-1.5 text-xs leading-5 text-[#404945]">
      <span className="text-[#602900]">
        <InvitationIcon name="clock" />
      </span>
      Hạn dùng: {time} (giờ Việt Nam).
    </p>
  );
}
