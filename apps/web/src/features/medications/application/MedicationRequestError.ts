import type { CourseConflict } from '@angia/contracts';
export class MedicationRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly conflicts: CourseConflict[] = [],
  ) {
    super(message);
    this.name = 'MedicationRequestError';
  }
}
