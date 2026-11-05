import { useEffect, useRef, useState } from 'react';

// Trả bản trình duyệt hiển thị được (vd. JPEG từ HEIC), hoặc null khi tệp không cần/không thể chuyển.
export type DisplayableImage = (file: File) => Promise<Blob | null>;

// Ảnh để che là object URL của tệp gốc; Chrome/Firefox không hiển thị HEIC thì chuyển một lần (D4).
export function useRedactionSource(file: File, originalUrl: string, toDisplayable: DisplayableImage) {
  const [src, setSrc] = useState(originalUrl);
  const [converting, setConverting] = useState(false);
  const converted = useRef<string | null>(null);
  const tried = useRef(false);
  useEffect(
    () => () => {
      if (converted.current) URL.revokeObjectURL(converted.current);
    },
    [],
  );
  // Gọi khi ảnh không hiển thị được; trả false nếu không còn cách nào khác (để báo lỗi).
  const fallback = () => {
    if (tried.current) return false;
    tried.current = true;
    setConverting(true);
    void toDisplayable(file)
      .catch(() => null)
      .then((blob) => {
        if (blob) setSrc((converted.current = URL.createObjectURL(blob)));
        setConverting(false);
      });
    return true;
  };
  return { src, converting, fallback };
}
