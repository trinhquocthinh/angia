import { PrivacyCanvas } from '../src/features/documents/presentation/components/PrivacyCanvas';
import { TileActions } from '../src/features/documents/presentation/components/TileActions';
import { TileStatus } from '../src/features/documents/presentation/components/TileStatus';
import { ImageExpandOverlay } from '../src/features/documents/presentation/components/ImageExpandOverlay';
import { planUpload } from '../src/features/documents/application/uploadQueue';

const edits = {
  rotation: 0 as const,
  crop: { left: 0, top: 0, width: 1000000, height: 1000000 },
  masks: [{ left: 0, top: 0, width: 500000, height: 500000 }],
};
const result = planUpload([new File(['fixture'], 'fixture.jpg', { type: 'image/jpeg' })], () => 'fixture');
if (!result.ok) throw new Error('Không tạo được ảnh thử');
const item = { ...result.items[0]!, status: 'uploading' as const, progress: 50 };
const noop = () => {};

export function ThemeImageSamples() {
  return (
    <>
      <div data-testid="image-actions" className="relative h-40 bg-paper">
        <TileActions name="thử" ready={false} onRemove={noop} onRedact={noop} />
        <ImageExpandOverlay onExpand={noop} />
      </div>
      <div data-testid="image-busy" className="relative h-40 bg-paper">
        <TileStatus item={item} onRemove={noop} />
      </div>
      <div data-testid="image-failed">
        <PrivacyCanvas
          src="/missing-theme-image.png"
          edits={edits}
          mode="mask"
          disabled={false}
          onBegin={noop}
          onRectangle={noop}
          onPreview={noop}
        />
      </div>
      <div data-testid="image-loaded">
        <PrivacyCanvas
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E"
          edits={edits}
          mode="mask"
          disabled={false}
          onBegin={noop}
          onRectangle={noop}
          onPreview={noop}
        />
      </div>
    </>
  );
}
