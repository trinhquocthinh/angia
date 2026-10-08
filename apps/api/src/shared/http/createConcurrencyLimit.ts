// Giới hạn số việc chạy đồng thời trong một tiến trình API: không xếp hàng, hết chỗ thì từ chối ngay
// để client thử lại sau. Trả về hàm nhả chỗ (gọi nhiều lần vẫn chỉ nhả một chỗ) hoặc null khi đã đầy.
export function createConcurrencyLimit(max: number) {
  let active = 0;
  return {
    tryAcquire(): (() => void) | null {
      if (active >= max) return null;
      active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        active -= 1;
      };
    },
  };
}
