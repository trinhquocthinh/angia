import type { RegistrationWriteFailure } from '../application/ports.js';

// Lỗi nghiệp vụ sau INSERT phải ném để transaction rollback trước khi trả outcome.
export class RegistrationRejected extends Error {
  constructor(readonly outcome: RegistrationWriteFailure) {
    super(outcome.code);
    this.name = 'RegistrationRejected';
  }
}
