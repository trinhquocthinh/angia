// Mã chẩn đoán an toàn để log: chỉ tên lớp lỗi và mã máy (SQLSTATE pg, mã errno Node).
// Không lấy message — có thể chứa uid/email/token. Giá trị không đúng dạng thì bỏ.
const SAFE_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const SAFE_CODE = /^[A-Z0-9_]{1,32}$/;

export interface ErrorDiagnostics {
  errorName?: string;
  errorCode?: string;
}

export function errorDiagnostics(error: unknown): ErrorDiagnostics {
  if (!(error instanceof Error)) return {};
  const code: unknown = (error as { code?: unknown }).code;
  return {
    ...(SAFE_NAME.test(error.name) ? { errorName: error.name } : {}),
    ...(typeof code === 'string' && SAFE_CODE.test(code) ? { errorCode: code } : {}),
  };
}
