export class PasswordHashBusyError extends Error {
  constructor() {
    super('ERR_PASSWORD_HASH_BUSY');
    this.name = 'PasswordHashBusyError';
  }
}
