import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationRepository } from '../application/ports';
import { useSelfReportedCourse } from '../application/useSelfReportedCourse';
import { SelfReportedCourseSheetBody } from './SelfReportedCourseSheetBody';
type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  repository: MedicationRepository;
  onClose: () => void;
};
export function SelfReportedCourseSheet({ profile, session, repository, onClose }: Props) {
  const state = useSelfReportedCourse(repository, session, profile.id);
  return <SelfReportedCourseSheetBody profile={profile} state={state} onClose={onClose} />;
}
