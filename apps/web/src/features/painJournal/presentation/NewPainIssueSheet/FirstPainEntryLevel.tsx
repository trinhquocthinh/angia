import type { FirstEntryFieldsProps } from './newPainIssueTypes';
import { PainLevelPicker } from '../PainLevelPicker/PainLevelPicker';
export function FirstPainEntryLevel({ values, onChange }: FirstEntryFieldsProps) {
  return <PainLevelPicker value={values.level} onChange={(level) => onChange({ level })} />;
}
