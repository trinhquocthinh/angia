// Dòng nhãn đầu trang Gia đình trên desktop: tên sổ + tên gia đình.
export function HomeBadges({ familyName }: { familyName: string | undefined }) {
  return (
    <div className="hidden items-center gap-2.5 lg:flex">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#aef0da]/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#2f6f5e] uppercase">
        <span className="h-2 w-2 rounded-full bg-[#286958]" />
        Hồ sơ sức khỏe gia đình
      </span>
      {familyName && (
        <>
          <span className="text-xs text-[#bfc9c4]">•</span>
          <span className="rounded-full bg-[#e4f0f0] px-3 py-1 text-xs font-semibold text-[#004135]">
            {familyName}
          </span>
        </>
      )}
    </div>
  );
}
