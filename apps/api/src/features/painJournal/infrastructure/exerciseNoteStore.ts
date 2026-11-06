import { exerciseNotes } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PainIssueStore } from '../application/ports.js';
import { painChildWhere } from './painChildWhere.js';
import { readExerciseNotes } from './readExerciseNotes.js';

export function exerciseNoteStore(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<PainIssueStore, 'findExercise' | 'insertExercise' | 'updateExercise' | 'deleteExercise'> {
  const findExercise: PainIssueStore['findExercise'] = async (profileId, issueId, exerciseId) =>
    (await readExerciseNotes(tx, familyId, profileId, issueId, exerciseId))[0] ?? null;
  return {
    findExercise,
    insertExercise: async (profileId, issueId, value, audit) => {
      const [row] = await tx
        .insert(exerciseNotes)
        .values({
          familyId,
          healthProfileId: profileId,
          painIssueId: issueId,
          ...value,
          createdByAccountId: audit.accountId,
          updatedByAccountId: audit.accountId,
          createdAt: audit.at,
          updatedAt: audit.at,
        })
        .returning({ id: exerciseNotes.id });
      const exercise = row && (await findExercise(profileId, issueId, row.id));
      if (!exercise) throw new Error('Không đọc được bài tập vừa tạo');
      return exercise;
    },
    updateExercise: async (profileId, issueId, exerciseId, value, audit) => {
      await tx
        .update(exerciseNotes)
        .set({ ...value, updatedByAccountId: audit.accountId, updatedAt: audit.at })
        .where(painChildWhere(exerciseNotes, familyId, profileId, issueId, exerciseId));
      const exercise = await findExercise(profileId, issueId, exerciseId);
      if (!exercise) throw new Error('Không đọc được bài tập vừa sửa');
      return exercise;
    },
    deleteExercise: async (profileId, issueId, exerciseId) => {
      await tx
        .delete(exerciseNotes)
        .where(painChildWhere(exerciseNotes, familyId, profileId, issueId, exerciseId));
    },
  };
}
