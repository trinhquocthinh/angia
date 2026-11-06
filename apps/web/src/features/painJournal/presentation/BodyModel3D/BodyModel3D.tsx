import { type ComponentType, useEffect, useState } from 'react';
import type { Object3D } from 'three';
import { loadBodyModel3D } from '../../application/loadBodyModel3D';
import type { BodyLocation } from '../../application/regionFromNodeName';
import { hasWebGL } from './hasWebGL';

type SceneProps = { model: Object3D; onSelect: (location: BodyLocation) => void };
type Loaded = { Scene: ComponentType<SceneProps>; model: Object3D };
type State = { status: 'loading' } | { status: 'unavailable' } | ({ status: 'ready' } & Loaded);

// three/fiber và GLB chỉ nạp ở đây, qua import động, để không lọt vào gói ban đầu (R-v3-2).
const loadScene = async (): Promise<Loaded> => {
  const [{ BodyModel3DScene }, { loadBodyGltf }] = await Promise.all([
    import('./BodyModel3DScene'),
    import('./loadBodyGltf'),
  ]);
  return { Scene: BodyModel3DScene, model: await loadBodyGltf() };
};

type Props = { onSelect: (location: BodyLocation) => void };

export function BodyModel3D({ onSelect }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    void loadBodyModel3D(hasWebGL, loadScene).then((loaded) => {
      if (active) setState(loaded ? { status: 'ready', ...loaded } : { status: 'unavailable' });
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'unavailable')
    return (
      <p role="alert" className="rounded-xl bg-[#e4f0ef] p-4 text-sm">
        Không mở được chế độ 3D trên thiết bị này.
      </p>
    );
  if (state.status === 'loading')
    return (
      <div
        role="status"
        className="grid h-full place-items-center rounded-xl bg-[#f3f0eb] text-sm text-[#55615f]"
      >
        Đang tải mô hình 3D…
      </div>
    );
  return <state.Scene model={state.model} onSelect={onSelect} />;
}
