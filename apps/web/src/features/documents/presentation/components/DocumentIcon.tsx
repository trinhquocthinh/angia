const paths = {
  lock: 'M6 11h12v10H6Z M8 11V7a4 4 0 0 1 8 0v4',
  upload: 'M14 3H6v18h12V7Z M14 3v4h4 M12 17v-6 M9 13l3-3 3 3',
  people:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M3 20c0-3 3-5 6-5s6 2 6 5 M17 11a2.5 2.5 0 1 0 0-5 M18 15c2 .5 3 2 3 5',
  category: 'M12 3l4.5 7h-9Z M4 14h6v6H4Z M14 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  family:
    'M5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M19 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M3.5 21v-5H3v-5a2 2 0 0 1 4 0v5h-.5v5 M17.5 21v-4H16l1.2-5.5a1.8 1.8 0 0 1 3.6 0L22 17h-1.5v4 M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M10.5 21v-4.5a1.5 1.5 0 0 1 3 0V21',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M8 12.5l2.7 2.7L16 9.5',
  microscope: 'M5 21h14 M8 18h8 M10 3h4v9h-4Z M12 12v3 M16 8a6 6 0 0 1-2 10.5',
  check: 'M5 12l5 5L20 7',
  warning: 'M12 3 2 20h20Z M12 10v4 M12 17v.5',
  close: 'M6 6l12 12 M18 6 6 18',
  image: 'M3 5h18v14H3Z M3 16l5-5 4 4 3-3 6 6 M15 9.5a1 1 0 1 0 0-.01',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  prescription:
    'M9 3h6v3H9Z M7 4.5H5V21h14V4.5h-2 M9 10v7 M9 10h2.5a1.75 1.75 0 0 1 0 3.5H9 M11 13.5l4 3.5 M15 13.5l-4 3.5',
  lab: 'M9 3h6 M10 3v6l-5 10a1.5 1.5 0 0 0 1.4 2h11.2a1.5 1.5 0 0 0 1.4-2L14 9V3 M7.5 15h9',
  monitor: 'M3 5h18v12H3Z M8 21h8 M6 11h3l2-3 2 6 2-3h3',
  file: 'M14 3H6v18h12V7Z M14 3v4h4',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z M8.5 12l2.5 2.5 4.5-5',
  cloud: 'M7 18a4 4 0 0 1-.6-7.95 5.5 5.5 0 0 1 10.7-1A4.5 4.5 0 0 1 17 18Z',
  sparkle: 'M11 4l1.8 5.2L18 11l-5.2 1.8L11 18l-1.8-5.2L4 11l5.2-1.8Z M18.5 3v4 M16.5 5h4',
  plus: 'M12 5v14 M5 12h14',
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
