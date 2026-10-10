import { Link } from '@tanstack/react-router';

// Lối vào nhập trực tiếp không kèm ảnh (SPEC-011): số đo, đơn thuốc hoặc phiếu xét nghiệm.
export function ManualEntryLink({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/manual"
      params={{ profileId }}
      className="ml-auto min-h-11 shrink-0 content-center rounded-full bg-[#e4f0f0] px-4 text-sm font-semibold text-[#004135] hover:bg-[#deebea]"
    >
      Nhập tay
    </Link>
  );
}
