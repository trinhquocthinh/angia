import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
export class PainJournalRequestError extends MedicationRequestError {
  constructor(
    message: string,
    status: number,
    code?: string,
    public readonly existingIssueId?: string,
  ) {
    super(message, status, code);
    this.name = 'PainJournalRequestError';
  }
}
