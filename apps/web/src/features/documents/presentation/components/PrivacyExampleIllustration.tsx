// Minh hoạ ✗/✓ cho popup tải ảnh (BR-041): hai thẻ đơn thuốc giả lập, không chứa chữ thật để đọc được.
// Dòng định danh vẽ bằng thanh màu; bên "Nên" thanh đó bị che bằng mảng tối như công cụ che của ứng dụng.
const LINE = 'var(--color-border)';

function PrescriptionSketch({ masked }: { masked: boolean }) {
  return (
    <svg viewBox="0 0 160 190" className="h-auto w-full" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="158"
        height="188"
        rx="10"
        fill="var(--color-surface)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <rect x="14" y="14" width="70" height="8" rx="4" fill="var(--color-text-secondary)" />
      {/* Dòng định danh: họ tên, mã bệnh nhân */}
      <g>
        <rect
          x="14"
          y="34"
          width="110"
          height="9"
          rx="4"
          fill={masked ? 'var(--color-redaction-mask)' : 'var(--color-warning)'}
        />
        <rect
          x="14"
          y="50"
          width="80"
          height="9"
          rx="4"
          fill={masked ? 'var(--color-redaction-mask)' : 'var(--color-warning)'}
        />
      </g>
      <line x1="14" y1="70" x2="146" y2="70" stroke="var(--color-accent-soft)" strokeWidth="2" />
      {/* Nội dung cần đọc: thuốc, liều, ngày */}
      {[84, 112, 140].map((y) => (
        <g key={y}>
          <circle cx="20" cy={y + 4} r="4" fill="var(--color-accent)" />
          <rect x="30" y={y} width="96" height="8" rx="4" fill={LINE} />
          <rect x="30" y={y + 13} width="60" height="6" rx="3" fill="var(--color-accent-soft)" />
        </g>
      ))}
      <rect x="96" y="168" width="50" height="8" rx="4" fill={LINE} />
    </svg>
  );
}

export function PrivacyExampleIllustration() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <figure className="m-0 flex flex-col gap-2 rounded-xl border-2 border-warning bg-warning-soft p-3">
        <PrescriptionSketch masked={false} />
        <figcaption className="text-center text-sm font-semibold text-warning">
          ✗ Không nên — còn họ tên, mã bệnh nhân
        </figcaption>
      </figure>
      <figure className="m-0 flex flex-col gap-2 rounded-xl border-2 border-accent bg-accent-soft p-3">
        <PrescriptionSketch masked />
        <figcaption className="text-center text-sm font-semibold text-accent">
          ✓ Nên — đã che, chỉ còn thuốc, liều, ngày
        </figcaption>
      </figure>
    </div>
  );
}
