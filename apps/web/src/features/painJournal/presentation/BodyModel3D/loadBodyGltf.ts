import type { Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import bodyUrl from '@src/assets/models/body.glb?url';

/** Nạp `body.glb` nén meshopt; decoder dùng WASM nên cần CSP cho phép `'wasm-unsafe-eval'`. */
export async function loadBodyGltf(): Promise<Object3D> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene } = await loader.loadAsync(bodyUrl);
  // Vùng chỉ để raycast (Raycaster không xét `visible`); ẩn đi để bớt 35 lần vẽ mỗi khung hình.
  scene.traverse((node) => {
    if (node.name.startsWith('region__')) node.visible = false;
  });
  return scene;
}
