import { ThemeImageSamples } from './ThemeImageSamples';
import { ThemeChartSamples } from './ThemeChartSamples';
import { useState } from 'react';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { useDocumentTheme } from '../src/shared/theme/useDocumentTheme';
import { AuthLayout } from '../src/features/auth/presentation/components/AuthLayout';
import { SidePanelFooter } from '../src/shared/ui/SidePanelFooter';
import { BodyModel3DScene } from '../src/features/painJournal/presentation/BodyModel3D/BodyModel3DScene';
import { createBrowserRedactionCodec } from '../src/shared/utils/image/createBrowserRedactionCodec';

const model = new Group();
const body = new Mesh(new SphereGeometry(0.2), new MeshStandardMaterial());
body.position.y = 0.5;
const region = new Mesh(new SphereGeometry(0.1), new MeshStandardMaterial());
region.name = 'region__knee__left';
region.position.y = 0.5;
region.visible = false;
model.add(body, region);

async function redactionPixels() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'red';
  ctx.fillRect(1, 0, 1, 1);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
  const codec = createBrowserRedactionCodec();
  const image = await codec.decode(new File([blob], 'fixture.png', { type: 'image/png' }));
  const rendered = await codec.render(image, {
    rotation: 0,
    rotated: { width: 2, height: 2 },
    masks: [{ left: 0, top: 0, width: 1, height: 1 }],
    crop: { left: 0, top: 0, width: 2, height: 2 },
    scale: 1,
  });
  try {
    return JSON.stringify(Array.from(codec.readPixels(rendered).data));
  } finally {
    codec.dispose(rendered);
    image.release();
  }
}

export function ThemeMigrationHarness() {
  const theme = useDocumentTheme();
  const [colors, setColors] = useState('');
  const [pixels, setPixels] = useState('');
  return (
    <section data-testid="migration" data-theme={theme}>
      <AuthLayout>
        <input
          aria-label="Ô nhập thử"
          className="bg-surface text-text-primary placeholder:text-text-secondary"
          placeholder="Nội dung"
        />
      </AuthLayout>
      <SidePanelFooter
        submitLabel="Lưu thử"
        cancelLabel="Hủy thử"
        disabled={false}
        submit={false}
        cancelDisabled={false}
        onCancel={() => {}}
      />
      <ThemeChartSamples />
      <ThemeImageSamples />
      <div className="h-64">
        <BodyModel3DScene model={model} selected={{ region: 'knee', side: 'left' }} onSelect={() => {}} />
      </div>
      <button
        onClick={() =>
          setColors(
            `${(body.material as MeshStandardMaterial).color.getHexString()},${(region.material as MeshStandardMaterial).color.getHexString()}`,
          )
        }
      >
        Kiểm tra mô hình
      </button>
      <output data-testid="model-colors">{colors}</output>
      <button
        onClick={() => {
          void redactionPixels().then(setPixels);
        }}
      >
        Kiểm tra ảnh
      </button>
      <output data-testid="redaction-pixels">{pixels}</output>
    </section>
  );
}
