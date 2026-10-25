export function AdminLoading() {
  return (
    <div
      className="admin-panel min-w-0 bg-white rounded-[16px] shadow-[0_1px_2px_#0000000d] [&_h2]:text-[18px] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 grid gap-4"
      role="status"
      aria-label="Đang tải bảng quản trị"
    >
      <span className="sr-only">Đang tải bảng quản trị</span>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-12 rounded-[8px] bg-[#eaf6f5] animate-[admin-pulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
