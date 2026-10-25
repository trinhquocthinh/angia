// Ba icon của thẻ Ngân sách AI (Stitch: psychology, schedule, tune) vẽ SVG vì font icon quản trị là bản rút gọn.
const paths = {
  ai: 'M12 3a4 4 0 0 0-4 4 4 4 0 0 0-3 6.5A4 4 0 0 0 9 20h1V3.5 M12 3a4 4 0 0 1 4 4 4 4 0 0 1 3 6.5A4 4 0 0 1 15 20h-1V3.5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  tune: 'M4 7h9 M17 7h3 M15 5v4 M4 17h3 M11 17h9 M9 15v4',
} as const;

export function BudgetIcon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={paths[name]} />
    </svg>
  );
}
