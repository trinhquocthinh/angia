import { BodyMapFigure } from './BodyMapFigure';
import type { BodyMapProps } from './bodyMapTypes';

export function BackSvg(props: BodyMapProps) {
  return <BodyMapFigure {...props} view="back" />;
}
