import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Object3D } from 'three';
import { readThemeColor } from '@src/shared/theme/readThemeColor';
import { useDocumentTheme } from '@src/shared/theme/useDocumentTheme';
import { applyBodyColor } from './applyBodyColor';

export function BodyModelAppearance({ model }: { model: Object3D }) {
  const theme = useDocumentTheme();
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const restore = applyBodyColor(model, readThemeColor('body-fill'));
    invalidate();
    return restore;
  }, [model, theme, invalidate]);
  return null;
}
