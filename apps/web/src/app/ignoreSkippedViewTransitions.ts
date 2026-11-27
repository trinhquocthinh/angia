/**
 * Router gọi `startViewTransition` nhưng không bắt `ready`; khi chuyển trang chồng nhau (ví dụ xoá token
 * khỏi URL lúc trang vừa tải) chuyển cảnh cũ bị bỏ qua và `ready` reject thành lỗi không bắt (L2 E30).
 * Bỏ qua là hành vi bình thường; lỗi thật trong hàm cập nhật vẫn đi qua `updateCallbackDone` router chờ.
 */
export function ignoreSkippedViewTransitions(doc: Document = document): void {
  if (typeof doc.startViewTransition !== 'function') return;
  const start = doc.startViewTransition.bind(doc);
  doc.startViewTransition = ((...args: Parameters<Document['startViewTransition']>) => {
    const transition = start(...args);
    transition.ready.catch(() => undefined);
    return transition;
  }) as Document['startViewTransition'];
}
