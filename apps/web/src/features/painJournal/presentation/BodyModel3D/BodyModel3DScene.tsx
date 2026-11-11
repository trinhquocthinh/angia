import { Canvas, type ThreeEvent } from '@react-three/fiber';
import type { Object3D } from 'three';
import { type BodyLocation, regionFromNodeName } from '../../application/regionFromNodeName';
import { BodyModelAppearance } from './BodyModelAppearance';
import { CameraControls } from './CameraControls';
import { SelectedRegionHighlight } from './SelectedRegionHighlight';

// Lệch quá ngưỡng (px) giữa nhấn và nhả là thao tác xoay, không phải chạm chọn vùng.
const TAP_SLOP_PX = 6;

type Props = { model: Object3D; selected: BodyLocation | null; onSelect: (location: BodyLocation) => void };

export function BodyModel3DScene({ model, selected, onSelect }: Props) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > TAP_SLOP_PX) return;
    // Chỉ xét vật gần nhất: chạm khe giữa hai vùng không được xuyên sang vùng mặt sau.
    const location = regionFromNodeName(event.intersections[0]?.object.name ?? '');
    if (location) onSelect(location);
  };
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [0, 0.5, 2.2], fov: 35, near: 0.1, far: 20 }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[1, 2, 3]} intensity={1.4} />
      <primitive object={model} onClick={handleClick} />
      <BodyModelAppearance model={model} />
      <SelectedRegionHighlight model={model} selected={selected} />
      <CameraControls />
    </Canvas>
  );
}
