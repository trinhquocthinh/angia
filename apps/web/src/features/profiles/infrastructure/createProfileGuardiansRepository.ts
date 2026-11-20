import { apiClient } from '@src/shared/api/apiClient';
import type { ProfileGuardiansRepository } from '../application/guardianPorts';

import { createGuardianReaders } from './createGuardianReaders';
import { createGuardianWriters } from './createGuardianWriters';

export function createProfileGuardiansRepository(client = apiClient): ProfileGuardiansRepository {
  return { ...createGuardianReaders(client), ...createGuardianWriters(client) };
}
