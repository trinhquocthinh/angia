// Minh hoạ ✗/✓ cho popup tải ảnh (BR-041): hai thẻ đơn thuốc giả lập, không chứa chữ thật để đọc được.
// Dòng định danh vẽ bằng thanh màu; bên "Nên" thanh đó bị che bằng mảng tối như công cụ che của ứng dụng.
const LINE = '#c9d6d3';

function PrescriptionSketch({ masked }: { masked: boolean }) {
  return (
    <svg viewBox="0 0 160 190" className="h-auto w-full" aria-hidden="true">
      <rect x="1" y="1" width="158" height="188" rx="10" fill="#ffffff" stroke="#d9e5e4" strokeWidth="2" />
      <rect x="14" y="14" width="70" height="8" rx="4" fill="#9fb1ad" />
      {/* Dòng định danh: họ tên, mã bệnh nhân */}
      <g>
        <rect x="14" y="34" width="110" height="9" rx="4" fill={masked ? '#131d1d' : '#e0745a'} />
        <rect x="14" y="50" width="80" height="9" rx="4" fill={masked ? '#131d1d' : '#e0745a'} />
      </g>
      <line x1="14" y1="70" x2="146" y2="70" stroke="#e4f0f0" strokeWidth="2" />
      {/* Nội dung cần đọc: thuốc, liều, ngày */}
      {[84, 112, 140].map((y) => (
        <g key={y}>
          <circle cx="20" cy={y + 4} r="4" fill="#286958" />
          <rect x="30" y={y} width="96" height="8" rx="4" fill={LINE} />
          <rect x="30" y={y + 13} width="60" height="6" rx="3" fill="#e4f0f0" />
        </g>
      ))}
      <rect x="96" y="168" width="50" height="8" rx="4" fill={LINE} />
    </svg>
  );
}

export function PrivacyExampleIllustration() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <figure className="m-0 flex flex-col gap-2 rounded-xl border-2 border-[#e0745a] bg-[#fff4ef] p-3">
        <PrescriptionSketch masked={false} />
        <figcaption className="text-center text-sm font-semibold text-[#9b472c]">
          ✗ Không nên — còn họ tên, mã bệnh nhân
        </figcaption>
      </figure>
      <figure className="m-0 flex flex-col gap-2 rounded-xl border-2 border-[#286958] bg-[#eef8f5] p-3">
        <PrescriptionSketch masked />
        <figcaption className="text-center text-sm font-semibold text-[#20594b]">
          ✓ Nên — đã che, chỉ còn thuốc, liều, ngày
        </figcaption>
      </figure>
    </div>
  );
}
