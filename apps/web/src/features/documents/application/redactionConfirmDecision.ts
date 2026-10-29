export type UploadChoice = 'ai' | 'manual';

// BR-041: gửi AI cần tick xác nhận; D5: mọi ảnh (kể cả tự nhập) không có vùng che thì hỏi lại trước.
export function redactionConfirmDecision(input: {
  choice: UploadChoice | null;
  checked: boolean;
  aiBlocked: boolean;
  maskCount: number;
  acknowledgedNoMask: boolean;
}): 'disabled' | 'ask-no-mask' | 'confirm' {
  const { choice, checked, aiBlocked, maskCount, acknowledgedNoMask } = input;
  const ready = choice === 'manual' || (choice === 'ai' && checked && !aiBlocked);
  if (!ready) return 'disabled';
  return maskCount === 0 && !acknowledgedNoMask ? 'ask-no-mask' : 'confirm';
}
