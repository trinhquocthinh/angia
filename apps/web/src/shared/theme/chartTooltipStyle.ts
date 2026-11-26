import { readTextSize } from '@src/shared/accessibility/readTextSize';
import { readThemeColor } from './readThemeColor';

export function chartTooltipStyle() {
  return {
    backgroundColor: readThemeColor('surface-raised'),
    borderColor: readThemeColor('border'),
    textStyle: { color: readThemeColor('text-primary'), fontSize: readTextSize('body') },
  };
}
