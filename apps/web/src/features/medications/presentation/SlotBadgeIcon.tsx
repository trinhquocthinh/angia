// Icon buổi uống thuốc gọn (SVG đơn sắc dùng token màu) khớp Stitch Liều Hôm Nay 8bafc41f / 1c851b03.
const PATHS = {
  morning:
    'M12 4v2m0 12v2M4 12h2m12 0h2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  noon: 'M12 3v2m0 14v2M3 12h2m14 0h2m-2.6-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
  afternoon: 'M12 4v3M5.6 8.6l2.1 2.1m10.7-2.1-2.1 2.1M4 15h16M8 15a4 4 0 1 1 8 0M6 19h12',
  evening: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5Z',
  as_needed: 'M9 4a5 5 0 0 1 7.1 7.1l-5 5A5 5 0 1 1 4 9l5-5Zm-1.5 3.5 9 9',
} as const;

export type MedicationSlotIconKey = keyof typeof PATHS;

const TONES: Record<MedicationSlotIconKey, string> = {
  morning: 'bg-warning-soft text-warning',
  noon: 'bg-accent-soft text-accent',
  afternoon: 'bg-warning-soft text-warning',
  evening: 'bg-surface-container text-accent',
  as_needed: 'bg-accent-soft text-secondary',
};

export function SlotBadgeIcon({ slot }: { slot: MedicationSlotIconKey }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[slot]}`}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={PATHS[slot]} />
      </svg>
    </span>
  );
}
