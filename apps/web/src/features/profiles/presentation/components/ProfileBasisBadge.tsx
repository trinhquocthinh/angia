import type { ProfileListItem } from '../../application/ports';

const basisBadge = {
  self: { label: 'Chính thức', className: 'bg-[#aef0da]/60 text-[#2f6f5e]' },
  guardian: { label: 'Phụ thuộc', className: 'bg-[#e4f0f0] text-[#404945]' },
};

// Nhãn căn cứ đồng thuận: người thân tự đồng ý (chính thức) hay người giám hộ đồng ý thay (phụ thuộc).
export function ProfileBasisBadge({ basis }: { basis: ProfileListItem['consentBasis'] }) {
  if (!basis) return null;
  const badge = basisBadge[basis];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
