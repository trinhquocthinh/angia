// Dòng nhãn đầu trang Gia đình trên desktop: tên sổ + tên gia đình.
export function HomeBadges({ familyName }: { familyName: string | undefined }) {
  return (
    <div className="hidden items-center gap-2.5 lg:flex">
      <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
        <span className="h-2 w-2 rounded-full bg-accent" />
        Hồ sơ sức khỏe gia đình
      </span>
      {familyName && (
        <>
          <span className="text-xs text-text-secondary">•</span>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {familyName}
          </span>
        </>
      )}
    </div>
  );
}
