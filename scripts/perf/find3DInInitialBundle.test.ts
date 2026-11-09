import { describe, expect, it } from 'vitest';
import { find3DInInitialBundle } from './find3DInInitialBundle.js';
import type { ViteManifest } from './initialBundle.js';

const manifest: ViteManifest = {
  '_route.js': { file: 'assets/route.js' },
  '_three.core.js': { file: 'assets/three.core.js' },
  'loadBodyGltf.ts': {
    file: 'assets/loadBodyGltf.js',
    isDynamicEntry: true,
    assets: ['assets/body-abc.glb'],
  },
};
const contents: Record<string, string> = {
  'assets/route.js': 'export const a=1;',
  'assets/three.core.js': 'window.__THREE__=r;',
  'assets/loadBodyGltf.js': 'export const u="/assets/body-abc.glb";',
};
const contentOf = (file: string) => contents[file] ?? '';

describe('find3DInInitialBundle', () => {
  it('TC-729 gói ban đầu không có three/GLB thì không báo gì', () => {
    const routes = [{ route: 'src/app/routes/index.tsx', files: ['assets/route.js'] }];
    expect(find3DInInitialBundle(manifest, routes, contentOf)).toEqual([]);
  });

  it('TC-729 báo chunk chứa three (r3f kéo theo three) trong gói ban đầu', () => {
    const routes = [
      { route: 'src/app/routes/my-profile.tsx', files: ['assets/route.js', 'assets/three.core.js'] },
    ];
    expect(find3DInInitialBundle(manifest, routes, contentOf)).toEqual([
      'src/app/routes/my-profile.tsx: assets/three.core.js chứa three',
    ]);
  });

  it('TC-729 báo chunk tham chiếu GLB trong gói ban đầu', () => {
    const routes = [{ route: 'src/app/routes/index.tsx', files: ['assets/loadBodyGltf.js'] }];
    expect(find3DInInitialBundle(manifest, routes, contentOf)).toEqual([
      'src/app/routes/index.tsx: assets/loadBodyGltf.js kéo theo assets/body-abc.glb',
    ]);
  });
});
