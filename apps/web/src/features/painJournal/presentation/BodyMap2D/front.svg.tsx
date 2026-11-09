import { BodyMapFigure } from './BodyMapFigure';
import type { BodyMapProps } from './bodyMapTypes';

export function FrontSvg(props: BodyMapProps) {
  return <BodyMapFigure {...props} view="front" />;
}
