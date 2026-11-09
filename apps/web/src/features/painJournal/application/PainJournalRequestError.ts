import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
export class PainJournalRequestError extends MedicationRequestError {
  constructor(
    message: string,
    status: number,
    code?: string,
    public readonly existingIssueId?: string,
    public readonly reason?: string,
  ) {
    super(message, status, code);
    this.name = 'PainJournalRequestError';
  }
}
