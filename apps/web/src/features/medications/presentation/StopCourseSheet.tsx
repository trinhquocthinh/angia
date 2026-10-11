import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationStoppingRepository } from '../application/stoppingPorts';
import { useStoppableCourses } from '../application/useStoppableCourses';
import { useStopCourse } from '../application/useStopCourse';
import { StopCourseSheetBody } from './StopCourseSheetBody';
type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  repository: MedicationStoppingRepository;
  onClose: () => void;
};
export function StopCourseSheet({ profile, session, repository, onClose }: Props) {
  const courses = useStoppableCourses(repository, session, profile);
  const state = useStopCourse(repository, session, profile.id);
  return <StopCourseSheetBody profile={profile} courses={courses} state={state} onClose={onClose} />;
}
