import { Link } from '@tanstack/react-router';

// Lối vào nhập trực tiếp không kèm ảnh (SPEC-011): số đo, đơn thuốc hoặc phiếu xét nghiệm.
export function ManualEntryLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/manual"
      params={{ profileId }}
      className="min-h-11 shrink-0 content-center rounded-xl bg-[#004135] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#20594b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
    >
      Nhập tay
    </Link>
  );
}
