import { accountErrorMessage } from '@src/features/account/application/accountErrorMessage';

const deletionMessages: Record<string, string> = {
  ERR_OWNER_MUST_TRANSFER: 'Hãy trao quyền Chủ hộ cho người khác trước.',
  ERR_OWNER_MUST_DELETE_FAMILY: 'Bạn là người duy nhất trong nhà. Hãy xoá nhà nếu không dùng nữa.',
  ERR_LAST_GUARDIAN: 'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Hãy thêm người giám hộ khác trước.',
};

export function accountDeletionErrorMessage(code: string): string {
  return (
    (Object.hasOwn(deletionMessages, code) ? deletionMessages[code] : undefined) ?? accountErrorMessage(code)
  );
}
