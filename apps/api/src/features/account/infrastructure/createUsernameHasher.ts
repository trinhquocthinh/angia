import { createHmac } from 'node:crypto';

export function createUsernameHasher(secret: string): (usernameNormalized: string) => string {
  return (usernameNormalized) => createHmac('sha256', secret).update(usernameNormalized).digest('hex');
}
