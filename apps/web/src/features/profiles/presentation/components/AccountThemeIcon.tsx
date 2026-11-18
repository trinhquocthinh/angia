const paths = {
  light:
    'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  dark: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z',
  system: 'M3 4h18v12H3V4Zm5 16h8m-4-4v4',
} as const;
export function AccountThemeIcon({ mode }: { mode: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[mode]} />
    </svg>
  );
}
