import { describe, expect, it } from 'vitest';
import { measureInitialBundles, type ViteManifest } from './initialBundle.js';

const manifest: ViteManifest = {
  'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_react.js'], css: ['assets/index.css'] },
  '_react.js': { file: 'assets/react.js' },
  '_shared.js': { file: 'assets/shared.js', imports: ['_react.js'] },
  'src/app/routes/index.tsx?tsr-split=component': {
    file: 'assets/home.js',
    isDynamicEntry: true,
    imports: ['_shared.js', '_react.js'],
    dynamicImports: ['_chart.js'],
  },
  'src/app/routes/login.tsx?tsr-split=component': { file: 'assets/login.js', isDynamicEntry: true },
  '_chart.js': { file: 'assets/chart.js', isDynamicEntry: true },
};

const sizes: Record<string, number> = {
  'assets/index.js': 100,
  'assets/react.js': 10,
  'assets/shared.js': 30,
  'assets/home.js': 5,
  'assets/login.js': 1,
  'assets/chart.js': 500,
};

const measure = () => measureInitialBundles(manifest, (file) => sizes[file] ?? 0);

describe('measureInitialBundles', () => {
  it('TC-094 tính gói ban đầu gồm entry và các chunk import tĩnh, mỗi tệp một lần', () => {
    expect(measure().entry).toEqual({ files: ['assets/index.js', 'assets/react.js'], bytes: 110 });
  });

  it('TC-094 mỗi trang đầu cộng thêm chunk route và import tĩnh của nó', () => {
    const home = measure().routes.find((route) => route.route === 'src/app/routes/index.tsx');
    expect(home?.bytes).toBe(145);
  });

  it('TC-094 không tính chunk tải động (vd. biểu đồ) vào gói ban đầu', () => {
    const allFiles = measure().routes.flatMap((route) => route.files);
    expect(allFiles).not.toContain('assets/chart.js');
  });

  it('TC-094 chỉ coi chunk route TanStack là trang đầu, sắp xếp nặng nhất trước', () => {
    expect(measure().routes.map((route) => route.route)).toEqual([
      'src/app/routes/index.tsx',
      'src/app/routes/login.tsx',
    ]);
  });

  it('báo lỗi khi manifest không có entry', () => {
    expect(() => measureInitialBundles({}, () => 0)).toThrow('Không tìm thấy entry');
  });
});
