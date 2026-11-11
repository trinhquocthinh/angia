import { Link } from '@tanstack/react-router';

// Lối vào nhập trực tiếp không kèm ảnh (SPEC-011): số đo, đơn thuốc hoặc phiếu xét nghiệm.
export function ManualEntryLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/manual"
      params={{ profileId }}
      className="min-h-11 shrink-0 content-center rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Nhập tay
    </Link>
  );
}
