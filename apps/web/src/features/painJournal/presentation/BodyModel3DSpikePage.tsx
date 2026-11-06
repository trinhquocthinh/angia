import { bodyRegions } from '@angia/contracts';
import { useState } from 'react';
import type { BodyLocation } from '../application/regionFromNodeName';
import { BodyModel3D } from './BodyModel3D/BodyModel3D';

const SIDE_LABEL = { left: 'Trái', right: 'Phải', center: null } as const;

const describe = ({ region, side }: BodyLocation) =>
  [bodyRegions[region].label, SIDE_LABEL[side]].filter(Boolean).join(' · ');

// Trang thử spike E18-S2 (F-40): đo nạp, FPS khi xoay, độ trúng vùng trên máy thật. Bỏ khi E22 tích hợp 3D.
export function BodyModel3DSpikePage() {
  const [picked, setPicked] = useState<BodyLocation | null>(null);
  return (
    <section className="mx-auto flex h-dvh max-w-xl flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold">Thử mô hình 3D</h1>
      <p aria-live="polite" className="text-sm" data-region={picked ? `${picked.region}:${picked.side}` : ''}>
        {picked ? `Đã chọn: ${describe(picked)}` : 'Chạm vào một vùng trên mô hình.'}
      </p>
      <div className="min-h-0 flex-1">
        <BodyModel3D onSelect={setPicked} />
      </div>
    </section>
  );
}
