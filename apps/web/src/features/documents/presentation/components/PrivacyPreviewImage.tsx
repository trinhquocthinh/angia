import { documentImageUrl } from '../../infrastructure/createReviewRepository';
type Props = {
  documentId: string;
  rotation: number;
  size: { width: number; height: number };
  failed: boolean;
  onLoad: (width: number, height: number) => void;
  onError: () => void;
};
export function PrivacyPreviewImage({ documentId, rotation, size, failed, onLoad, onError }: Props) {
  const rotated = rotation === 90 || rotation === 270;
  return (
    <img
      src={documentImageUrl(documentId)}
      alt="Ảnh xem trước để cắt và che"
      draggable={false}
      onLoad={(event) => onLoad(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
      onError={onError}
      className="absolute left-1/2 top-1/2 max-w-none"
      style={{
        width: `${rotated ? (100 * size.width) / size.height : 100}%`,
        height: `${rotated ? (100 * size.height) / size.width : 100}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        visibility: failed ? 'hidden' : 'visible',
      }}
    />
  );
}
