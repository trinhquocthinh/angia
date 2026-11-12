import type { IdentityProvider, VerifiedIdentity } from '../identity/application/ports.js';

interface FakeIdentity {
  username: string;
  password: string;
  identity: VerifiedIdentity;
}

// Chỉ cho unit test; mật khẩu fixture không dùng làm credential lưu trữ.
export function createFakeIdentityProvider(seed: FakeIdentity[] = []): IdentityProvider {
  const records = structuredClone(seed);
  return {
    verifyPassword(username, password) {
      const record = records.find((entry) => entry.username === username.toLowerCase());
      return Promise.resolve(record?.password === password ? structuredClone(record.identity) : null);
    },
  };
}
