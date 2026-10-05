import { v7 } from 'uuid';

// Khóa chính UUIDv7 (Tech Spec §3) do ứng dụng sinh: PostgreSQL 16 chưa có hàm uuidv7().
export function newId(): string {
  return v7();
}
