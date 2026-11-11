import { readThemeColor } from '@src/shared/theme/readThemeColor';
import { useDocumentTheme } from '@src/shared/theme/useDocumentTheme';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { type Material, type Mesh, MeshBasicMaterial, type Object3D } from 'three';
import type { BodyLocation } from '../../application/regionFromNodeName';

type Props = { model: Object3D; selected: BodyLocation | null };

// Tô vùng đã chọn bằng màu nhấn (`--color-accent`), không tô theo mức đau (SPEC-058, BR-033).
export function SelectedRegionHighlight({ model, selected }: Props) {
  useDocumentTheme();
  const color = readThemeColor('accent');
  const invalidate = useThree((state) => state.invalidate);
  const material = useMemo(
    () => new MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }),
    [color],
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    if (!selected) return;
    const node = model.getObjectByName(`region__${selected.region}__${selected.side}`) as Mesh | undefined;
    if (!node) return;
    const original: Material | Material[] = node.material;
    node.material = material;
    node.visible = true;
    invalidate();
    return () => {
      node.material = original;
      node.visible = false;
      invalidate();
    };
  }, [model, selected, material, invalidate]);
  return null;
}
