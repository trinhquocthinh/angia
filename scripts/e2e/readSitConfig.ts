export const SIT_ORIGIN = 'https://angia-sit.toniboy.io.vn';

export function readSitConfig(env: NodeJS.ProcessEnv) {
  const baseURL = env.E2E_BASE_URL ?? SIT_ORIGIN;
  if (baseURL !== SIT_ORIGIN) throw new Error('E2E_BASE_URL phải đúng origin SIT');
  const familyId = env.E2E_FAMILY_ID ?? '';
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(familyId)) {
    throw new Error('E2E_FAMILY_ID phải là UUID gia đình thử riêng');
  }
  const storageState = env.E2E_STORAGE_STATE?.trim();
  if (!storageState) throw new Error('Thiếu E2E_STORAGE_STATE; cần đăng nhập tài khoản thử');
  return { baseURL, familyId, storageState };
}
