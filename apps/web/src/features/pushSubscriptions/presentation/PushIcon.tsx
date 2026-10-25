const paths = {
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  ring: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4 M3 4.5 5 3 M21 4.5 19 3',
  bellOff: 'M8.7 3.7A6 6 0 0 1 18 8c0 3 .8 5 1.6 6.4 M17 17H3c0-2 3-2 3-9 M10 21h4 M3 3l18 18',
  send: 'M4 12 3 4l18 8-18 8Z M4 12h7',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z M9 12l2 2 4-4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7 M20 4v4h-4',
  lock: 'M6 11h12v10H6Z M9 11V8a3 3 0 0 1 6 0v3',
  phone: 'M7 2h10v20H7Z M11 18h2',
  browser: 'M3 5h18v14H3Z M3 9h18',
  server: 'M4 4h16v6H4Z M4 14h16v6H4Z M8 7h.01 M8 17h.01',
  pill: 'M5 5h14v14H5Z M12 8v8 M8 12h8',
  back: 'M15 5l-7 7 7 7',
  share: 'M12 3v12 M8 7l4-4 4 4 M7 10H5v11h14V10h-2',
  addSquare: 'M4 4h16v16H4Z M12 8v8 M8 12h8',
  check: 'M5 12l5 5L20 7',
  menu: 'M12 5h.01 M12 12h.01 M12 19h.01',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  settings: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M16 4v4 M10 10v4 M18 16v4',
} as const;
export type PushIconName = keyof typeof paths;
export function PushIcon({ name, size = 20 }: { name: PushIconName; size?: number }) {
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
