import { useState } from 'react';
import { useStoppableCourses } from '@src/features/medications/application/useStoppableCourses';
import { createMedicationStoppingRepository } from '@src/features/medications/infrastructure/createMedicationStoppingRepository';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { matchingStoppableCourses } from '../application/matchingStoppableCourses';
import type { AdherencePeriod } from '../application/ports';
import { useStopMatchingCourses } from '../application/useStopMatchingCourses';
import { StopCoursesPrompt } from './StopCoursesPrompt';

const stoppingRepository = createMedicationStoppingRepository();

// Sau khi lưu "Ngưng": nếu danh mục còn đợt cùng tên dừng được thì hỏi có dừng luôn không.
export function StopCoursesFollowUp({
  profile,
  session,
  saved,
}: {
  profile: HealthProfile;
  session: ProfileSession;
  saved: AdherencePeriod;
}) {
  const stoppable = useStoppableCourses(stoppingRepository, session, profile);
  const stop = useStopMatchingCourses(stoppingRepository, session, profile.id);
  const [dismissed, setDismissed] = useState(false);
  // Sau khi dừng, danh sách tải lại không còn đợt khớp nhưng vẫn hiện thông báo đã dừng.
  const matches = matchingStoppableCourses(stoppable.data?.courses ?? [], saved);
  if (dismissed || (matches.length === 0 && !stop.stopped)) return null;
  return (
    <StopCoursesPrompt
      courses={matches}
      stopDate={saved.fromDate}
      pending={stop.pending}
      stopped={stop.stopped}
      failed={stop.failed}
      onConfirm={() =>
        void stop.submit(
          matches.map((course) => course.id),
          saved.fromDate,
        )
      }
      onDismiss={() => setDismissed(true)}
    />
  );
}
