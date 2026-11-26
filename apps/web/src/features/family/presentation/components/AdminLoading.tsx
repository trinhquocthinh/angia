export function AdminLoading() {
  return (
    <div
      className="profile-bento-card grid min-w-0 gap-4 p-5 sm:p-6"
      role="status"
      aria-label="Đang tải bảng quản trị"
    >
      <span className="sr-only">Đang tải bảng quản trị</span>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
