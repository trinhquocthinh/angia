const paths = {
  home: 'M3 10 12 3l9 7v11H3Z M9 21v-7h6v7',
  add: 'M12 5v14 M5 12h14',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  upload: 'M3 7h5l2-3h4l2 3h5v14H3Z M16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  review: 'M8 4H4v18h16V4h-4 M8 2h8v4H8Z M8 12h8 M8 16h5',
} as const;
export function ProfileIcon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={paths[name]} />
    </svg>
  );
}
