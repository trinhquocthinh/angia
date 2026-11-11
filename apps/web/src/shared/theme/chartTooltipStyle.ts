import { readThemeColor } from './readThemeColor';

export function chartTooltipStyle() {
  return {
    backgroundColor: readThemeColor('surface-raised'),
    borderColor: readThemeColor('border'),
    textStyle: { color: readThemeColor('text-primary') },
  };
}
