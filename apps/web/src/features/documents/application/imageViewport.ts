// Hình học khung xem ảnh chứng từ: tỉ lệ tính theo bề ngang khung (1 = vừa chiều ngang).
const MAX_SCALE = 4;

type Size = { width: number; height: number };
type Scroll = { left: number; top: number };

const odd = (turns: number) => turns % 2 === 1;

// Khung bao sau xoay và kích thước/độ lệch của <img> trước khi xoay quanh tâm.
export function imageBox(containerWidth: number, scale: number, natural: Size, turns: number) {
  const ratio = odd(turns) ? natural.width / natural.height : natural.height / natural.width;
  const width = containerWidth * scale;
  const height = width * ratio;
  const imageWidth = odd(turns) ? height : width;
  const imageHeight = odd(turns) ? width : height;
  return {
    width,
    height,
    imageWidth,
    imageHeight,
    offsetX: (width - imageWidth) / 2,
    offsetY: (height - imageHeight) / 2,
  };
}

// Tỉ lệ thấy trọn ảnh trong khung; không vượt quá vừa chiều ngang.
export function fitScale(container: Size, natural: Size, turns: number): number {
  const ratio = odd(turns) ? natural.width / natural.height : natural.height / natural.width;
  return Math.min(1, container.height / (container.width * ratio));
}

export const clampScale = (scale: number, min: number) => Math.min(MAX_SCALE, Math.max(min, scale));

// Vị trí cuộn mới để điểm `point` (toạ độ trong khung) vẫn nằm dưới con trỏ/ngón tay sau khi đổi tỉ lệ.
export function zoomAt(scroll: Scroll, point: { x: number; y: number }, from: number, to: number): Scroll {
  const factor = to / from;
  return {
    left: (scroll.left + point.x) * factor - point.x,
    top: (scroll.top + point.y) * factor - point.y,
  };
}
