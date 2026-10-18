/** Một mục trong `dist/.vite/manifest.json` của Vite (chỉ các trường cần dùng). */
interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

export type ViteManifest = Record<string, ManifestChunk>;

interface BundleMeasure {
  files: string[];
  bytes: number;
}

interface RouteBundleMeasure extends BundleMeasure {
  route: string;
}

export interface InitialBundleReport {
  entry: BundleMeasure;
  routes: RouteBundleMeasure[];
}

const ROUTE_SPLIT_SUFFIX = '?tsr-split=component';

/** Gom các khóa chunk theo import tĩnh (trình duyệt phải tải trước khi chạy), bỏ qua import động. */
const staticClosure = (manifest: ViteManifest, roots: string[]): Set<string> => {
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const key = stack.pop() as string;
    if (seen.has(key)) continue;
    seen.add(key);
    stack.push(...(manifest[key]?.imports ?? []));
  }
  return seen;
};

const toMeasure = (
  manifest: ViteManifest,
  keys: Set<string>,
  sizeOf: (file: string) => number,
): BundleMeasure => {
  const files = [...keys].map((key) => manifest[key]?.file).filter((file): file is string => Boolean(file));
  return { files, bytes: files.reduce((total, file) => total + sizeOf(file), 0) };
};

/**
 * NFR-1/TC-094: đo gói JS ban đầu = entry + import tĩnh, và với mỗi route TanStack (autoCodeSplitting)
 * khi được mở làm trang đầu = entry + chunk route + import tĩnh của nó. `sizeOf` trả kích thước đã nén gzip.
 */
export const measureInitialBundles = (
  manifest: ViteManifest,
  sizeOf: (file: string) => number,
): InitialBundleReport => {
  const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry);
  if (!entryKey) throw new Error('Không tìm thấy entry trong manifest Vite.');
  const entryKeys = staticClosure(manifest, [entryKey]);
  const routes = Object.keys(manifest)
    .filter((key) => key.endsWith(ROUTE_SPLIT_SUFFIX))
    .map((key) => ({
      route: key.slice(0, -ROUTE_SPLIT_SUFFIX.length),
      ...toMeasure(manifest, staticClosure(manifest, [entryKey, key]), sizeOf),
    }))
    .sort((a, b) => b.bytes - a.bytes);
  return { entry: toMeasure(manifest, entryKeys, sizeOf), routes };
};
