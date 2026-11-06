import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BodyMap2D } from '../src/features/painJournal/presentation/BodyMap2D/BodyMap2D';
import type { BodyLocation } from '../src/features/painJournal/application/regionFromNodeName';
import '../src/app/styles.css';

function BodyMap2DHarness() {
  const [selected, setSelected] = useState<BodyLocation | null>(null);
  const [tracking, setTracking] = useState(true);
  return (
    <>
      <BodyMap2D
        selected={selected}
        onSelect={setSelected}
        trackingLocations={tracking ? [{ region: 'knee', side: 'left' }] : []}
      />
      <output data-testid="selection">{JSON.stringify(selected)}</output>
      <button type="button" className="min-h-11" onClick={() => setTracking(!tracking)}>
        Đổi vùng theo dõi
      </button>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<BodyMap2DHarness />);
