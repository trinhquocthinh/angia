const paths = {
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z M9 12l2 2 4-4',
  calendar: 'M4 5h16v16H4Z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2',
  clock: 'M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  guardian:
    'M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M1 21v-5a5 5 0 0 1 10 0v5 M20 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M12 21v-3a5 5 0 0 1 10 0v3',
  copy: 'M8 8h13v13H8Z M16 8V3H3v13h5',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M20 12a8 8 0 0 0-14-5 M4 12a8 8 0 0 0 14 5',
  close: 'M6 6l12 12 M6 18 18 6',
  info: 'M12 10v7 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  check: 'M8 12l3 3 5-6 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  edit: 'm14 5 5 5 M4 20l4-1L21 6l-4-4L4 15Z',
  unlink: 'M3 3l18 18 M10 7l2-2a5 5 0 0 1 7 7l-2 2 M14 17l-2 2a5 5 0 0 1-7-7l2-2',
} as const;
export function InvitationIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
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
