import { showsVitals } from '@angia/contracts';
import type { HealthProfile } from './ports';
import { currentVietnamYear } from './currentVietnamYear';

export function profileShowsVitals(profile: HealthProfile): boolean {
  return showsVitals(profile, currentVietnamYear());
}
