/**
 * F-40/TC-730: nạp chế độ 3D. Không có WebGL, chunk lỗi hoặc mô hình không giải nén được
 * (kể cả CSP chặn WASM của decoder meshopt) đều trả null để giao diện quay về 2D.
 */
export async function loadBodyModel3D<T>(
  supportsWebGL: () => boolean,
  load: () => Promise<T>,
): Promise<T | null> {
  if (!supportsWebGL()) return null;
  try {
    return await load();
  } catch {
    return null;
  }
}
