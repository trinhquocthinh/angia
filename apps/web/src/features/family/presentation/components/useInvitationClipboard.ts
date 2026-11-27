import { useState } from 'react';

export function useInvitationClipboard() {
  const [notice, setNotice] = useState('');
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Đã sao chép');
    } catch {
      setNotice('Không sao chép được. Bạn có thể chọn và sao chép link hoặc mã trực tiếp.');
    }
  };
  return { notice, copy };
}
