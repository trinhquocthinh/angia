const paths = {
  forward: 'M4 12h16m-6-6 6 6-6 6',
  back: 'm10 5-7 7 7 7M3 12h18',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
} as const;

export function StartIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
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
