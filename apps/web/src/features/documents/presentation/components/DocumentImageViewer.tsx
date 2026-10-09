import { useImageViewport } from '../../application/useImageViewport';
import { useViewportGestures } from '../../application/useViewportGestures';
import { ImageZoomControls } from './ImageZoomControls';

type DocumentImageViewerProps = { src: string; turns: number; onError: () => void };

// Khung ảnh cuộn riêng, căn trên: phóng to rồi cuộn tới đúng dòng thuốc đang đối chiếu.
export function DocumentImageViewer({ src, turns, onError }: DocumentImageViewerProps) {
  const { containerRef, box, container, scale, mode, onLoad, fitPage, fitWidth, zoomTo } =
    useImageViewport(turns);
  useViewportGestures(containerRef, scale, zoomTo);
  const pannable = Boolean(
    box && container && (box.width > container.width + 1 || box.height > container.height + 1),
  );
  return (
    <>
      <ImageZoomControls
        scale={scale}
        mode={mode}
        disabled={!box}
        onFitPage={fitPage}
        onFitWidth={fitWidth}
        onZoom={(factor) => zoomTo(scale * factor)}
      />
      <div
        ref={containerRef}
        className={`min-h-0 flex-1 touch-pan-x touch-pan-y overflow-auto rounded-2xl bg-white [scrollbar-gutter:stable] ${
          pannable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div
          className="relative mx-auto"
          style={box ? { width: box.width, height: box.height } : { width: '100%' }}
        >
          <img
            src={src}
            alt="Ảnh chứng từ đang duyệt"
            draggable={false}
            onLoad={(event) => onLoad(event.currentTarget)}
            onError={onError}
            style={
              box
                ? {
                    position: 'absolute',
                    left: box.offsetX,
                    top: box.offsetY,
                    width: box.imageWidth,
                    height: box.imageHeight,
                    maxWidth: 'none',
                    transform: `rotate(${turns * 90}deg)`,
                  }
                : { width: '100%' }
            }
            className="select-none"
          />
        </div>
      </div>
    </>
  );
}
