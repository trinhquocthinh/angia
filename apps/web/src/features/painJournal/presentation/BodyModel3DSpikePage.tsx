import { useState } from 'react';
import type { BodyLocation } from '../application/regionFromNodeName';
import { recordTrialTap, startTrial } from '../application/smallRegionTrial';
import { BodyModel3D } from './BodyModel3D/BodyModel3D';
import { describeLocation } from './BodyModel3DSpike/describeLocation';
import { type LoadStats, readLoadStats } from './BodyModel3DSpike/readLoadStats';
import { SpikeStats } from './BodyModel3DSpike/SpikeStats';
import { useDragFps } from './BodyModel3DSpike/useDragFps';

// Trang thử spike E18-S2 (F-40): đo nạp, FPS khi xoay, độ trúng vùng trên máy thật. Bỏ khi E22 tích hợp 3D.
export function BodyModel3DSpikePage() {
  const [picked, setPicked] = useState<BodyLocation | null>(null);
  const [load, setLoad] = useState<LoadStats | null>(null);
  const [trial, setTrial] = useState(startTrial);
  const { result: fps, handlers } = useDragFps();
  const select = (location: BodyLocation) => {
    setPicked(location);
    setTrial((state) => recordTrialTap(state, location));
  };
  return (
    <section className="mx-auto flex h-dvh max-w-xl flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold">Thử mô hình 3D</h1>
      <p aria-live="polite" className="text-sm" data-region={picked ? `${picked.region}:${picked.side}` : ''}>
        {picked ? `Đã chọn: ${describeLocation(picked)}` : 'Chạm vào một vùng trên mô hình.'}
      </p>
      <div className="min-h-0 flex-1" {...handlers}>
        <BodyModel3D onSelect={select} onReady={() => setLoad(readLoadStats())} />
      </div>
      <SpikeStats load={load} fps={fps} trial={trial} onResetTrial={() => setTrial(startTrial())} />
    </section>
  );
}
