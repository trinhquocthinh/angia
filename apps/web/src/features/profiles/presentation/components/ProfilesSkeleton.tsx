export function ProfilesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải hồ sơ"
      className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
    >
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="h-[280px] animate-pulse rounded-2xl lg:rounded-3xl bg-surface motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
