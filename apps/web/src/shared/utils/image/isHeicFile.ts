const HEIC = /\.(heic|heif)$/i;
// Chrome/Firefox thường để type rỗng với HEIC nên xét thêm đuôi tệp.
export const isHeicFile = (file: File) =>
  file.type === 'image/heic' || file.type === 'image/heif' || HEIC.test(file.name);
