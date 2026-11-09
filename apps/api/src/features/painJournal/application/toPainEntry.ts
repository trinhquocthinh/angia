import type { PainEntry } from '@angia/contracts';
import { toPainActor } from './toPainActor.js';

export function toPainEntry(entry: PainEntry): PainEntry {
  return {
    id: entry.id,
    level: entry.level,
    recordedAt: entry.recordedAt,
    note: entry.note,
    createdBy: toPainActor(entry.createdBy),
    updatedBy: toPainActor(entry.updatedBy),
    updatedAt: entry.updatedAt,
  };
}
