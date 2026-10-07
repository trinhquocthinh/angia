const paths = {
  lock: 'M6 11h12v10H6Z M8 11V7a4 4 0 0 1 8 0v4',
  upload: 'M14 3H6v18h12V7Z M14 3v4h4 M12 17v-6 M9 13l3-3 3 3',
  people:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M3 20c0-3 3-5 6-5s6 2 6 5 M17 11a2.5 2.5 0 1 0 0-5 M18 15c2 .5 3 2 3 5',
  category: 'M4 4h7v7H4Z M13 4h7v7h-7Z M4 13h7v7H4Z M16.5 13a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7',
  check: 'M5 12l5 5L20 7',
  warning: 'M12 3 2 20h20Z M12 10v4 M12 17v.5',
  close: 'M6 6l12 12 M18 6 6 18',
  image: 'M3 5h18v14H3Z M3 16l5-5 4 4 3-3 6 6 M15 9.5a1 1 0 1 0 0-.01',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  prescription: 'M7 3h10v18H7Z M10 8h4 M10 12h4 M10 16h2',
  lab: 'M9 3h6 M10 3v6l-5 10a1.5 1.5 0 0 0 1.4 2h11.2a1.5 1.5 0 0 0 1.4-2L14 9V3 M7.5 15h9',
  monitor: 'M3 5h18v12H3Z M8 21h8 M6 11h3l2-3 2 6 2-3h3',
  file: 'M14 3H6v18h12V7Z M14 3v4h4',
} as const;
export type DocumentIconName = keyof typeof paths;
export function DocumentIcon({ name, size = 20 }: { name: DocumentIconName; size?: number }) {
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
