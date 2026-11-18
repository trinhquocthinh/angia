const paths = {
  back: 'm10 5-7 7 7 7M3 12h18',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  copy: 'M9 3h12v14H9zM5 7H3v14h12v-2',
  link: 'm10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1',
  send: 'm3 3 18 9-18 9 4-9-4-9Zm4 9h14',
  trash: 'M3 6h18M9 6V3h6v3M6 6v15h12V6M10 10v7m4-7v7',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 6v12M6 12h12M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  key: 'M10 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm0 0h12v4h-4v3h-4V8',
  check: 'm5 12 4 4L19 6',
  expired: 'M6 3h12M6 21h12M8 3v4l8 10v4M16 3v4l-3 4M8 17v4M3 3l18 18',
} as const;

export function InvitationIcon({ name }: { name: keyof typeof paths }) {
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
      <path d={paths[name]} />
    </svg>
  );
}
