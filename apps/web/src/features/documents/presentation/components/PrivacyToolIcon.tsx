type Name = 'crop' | 'mask' | 'add' | 'rotate' | 'undo' | 'shield' | 'keyboard' | 'info' | 'pointer';
const paths: Record<Name, string> = {
  crop: 'M6 3v15h15M3 6h15v15M9 6h9v9',
  mask: 'M4 5h16v14H4zM8 12h8',
  add: 'M4 4h16v16H4zM12 8v8M8 12h8',
  rotate: 'M20 6v6h-6M20 12a8 8 0 1 0-2 6',
  undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6',
  shield: 'M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6',
  keyboard: 'M3 6h18v12H3zM6 10h1m3 0h1m3 0h1m3 0h1M7 14h10',
  info: 'M12 8h.01M12 11v5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  pointer: 'M8 12V5a2 2 0 0 1 4 0v6l4-1 4 3-2 8H9l-5-7 2-2z',
};
export function PrivacyToolIcon({ name }: { name: Name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <path d={paths[name]} />
    </svg>
  );
}
