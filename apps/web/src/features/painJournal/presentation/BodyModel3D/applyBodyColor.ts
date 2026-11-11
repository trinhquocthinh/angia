import { Mesh, MeshStandardMaterial, type Object3D } from 'three';

// Vật liệu được chia sẻ trong GLB; dùng bản sao để đổi nền không sửa dữ liệu gốc.
export function applyBodyColor(model: Object3D, color: string): () => void {
  const restore: (() => void)[] = [];
  model.traverse((node) => {
    if (!(node instanceof Mesh) || node.name.startsWith('region__')) return;
    const original = node.material;
    const materials = Array.isArray(original) ? original : [original];
    const copies = materials.map((material) => {
      const copy = material.clone();
      if (copy instanceof MeshStandardMaterial) copy.color.set(color);
      return copy;
    });
    node.material = Array.isArray(original) ? copies : copies[0]!;
    restore.push(() => {
      node.material = original;
      copies.forEach((copy) => copy.dispose());
    });
  });
  return () => restore.forEach((reset) => reset());
}
