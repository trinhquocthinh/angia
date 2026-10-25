// heic-decode không kèm kiểu; chỉ khai báo phần spike dùng.
declare module 'heic-decode' {
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  function decode(input: { buffer: Uint8Array }): Promise<DecodedImage>;
  export = decode;
}
