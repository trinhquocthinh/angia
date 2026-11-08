import type { ViteManifest } from './initialBundle.js';

// three.core gán `window.__THREE__`; chuỗi thuộc tính này còn nguyên sau minify. r3f luôn kéo theo three.
const THREE_SIGNATURE = '__THREE__';

interface RouteFiles {
  route: string;
  files: string[];
}

/** TC-729: liệt kê chunk trong gói ban đầu của route có chứa three hoặc kéo theo GLB; rỗng nghĩa là đạt. */
export function find3DInInitialBundle(
  manifest: ViteManifest,
  routes: RouteFiles[],
  contentOf: (file: string) => string,
): string[] {
  const assetsOf = new Map(Object.values(manifest).map((chunk) => [chunk.file, chunk.assets ?? []]));
  return routes.flatMap(({ route, files }) =>
    files.flatMap((file) => {
      const found: string[] = [];
      if (contentOf(file).includes(THREE_SIGNATURE)) found.push(`${route}: ${file} chứa three`);
      for (const asset of assetsOf.get(file) ?? []) {
        if (asset.endsWith('.glb')) found.push(`${route}: ${file} kéo theo ${asset}`);
      }
      return found;
    }),
  );
}
