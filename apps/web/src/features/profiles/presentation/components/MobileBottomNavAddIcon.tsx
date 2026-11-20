export function MobileBottomNavAddIcon() {
  return (
    <svg
      className="mobile-nav-plus"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.6"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <line x1="12" x2="12" y1="5.5" y2="18.5" />
      <line x1="5.5" x2="18.5" y1="12" y2="12" />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="var(--color-nav-icon-jade-light)"
        strokeDasharray="2 4"
        strokeOpacity="0.4"
        strokeWidth="1.4"
      />
    </svg>
  );
}
