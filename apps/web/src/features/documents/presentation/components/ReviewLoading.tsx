import './review-motion.css';

export function ReviewLoading() {
  return (
    <div
      role="status"
      className="review-shimmer h-[480px] rounded-[20px] bg-white shadow-card"
      aria-label="Đang tải giấy tờ"
    />
  );
}
