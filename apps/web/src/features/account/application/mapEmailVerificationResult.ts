import { accountErrorMessage } from '@src/features/account/application/accountErrorMessage';
import type { AccountResult } from '@src/features/account/application/ports';

type VerifyEmailStage = 'verifying' | 'success' | 'invalid' | 'taken' | 'error';

export type VerifyEmailState = {
  stage: VerifyEmailStage;
  error: string | null;
};

/** Ánh xạ kết quả API xác nhận email sang trạng thái màn hình (SPEC-085). */
export function mapEmailVerificationResult(result: AccountResult<void>): VerifyEmailState {
  if (result.ok) return { stage: 'success', error: null };
  if (result.code === 'ERR_VERIFICATION_TOKEN_INVALID') return { stage: 'invalid', error: null };
  if (result.code === 'ERR_EMAIL_TAKEN') return { stage: 'taken', error: null };
  return { stage: 'error', error: accountErrorMessage(result.code) };
}
