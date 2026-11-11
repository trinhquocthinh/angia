// Gạch chân tab đang mở; view-transition-name chung giúp nó trượt từ tab cũ sang tab mới khi đổi trang.
export function TabUnderline({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      aria-hidden="true"
      className="angia-tab-indicator absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent"
    />
  );
}
